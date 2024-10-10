import { Rundown } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { DeleteResult, MongoClient, UpdateOneModel } from 'mongodb'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'
import { Piece } from '../../../model/entities/piece'
import { Segment } from '../../../model/entities/segment'
import { MongoEntityConverter, MongoPart, MongoPiece, MongoRundown, MongoSegment } from './mongo-entity-converter'
import { MongoSegmentRepository } from './mongo-segment-repository'
import { MongoPartRepository } from './mongo-part-repository'
import { MongoPieceRepository } from './mongo-piece-repository'
import { Part } from '../../../model/entities/part'

export const RUNDOWN_COLLECTION_NAME: string = 'executedRundowns' // TODO: Once we control ingest renamed this to "rundowns".

export class MongoRundownRepository extends BaseMongoRepository<MongoRundown> implements RundownRepository {

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoSegmentRepository: MongoSegmentRepository,
    private readonly mongoPartRepository: MongoPartRepository,
    private readonly mongoPieceRepository: MongoPieceRepository,
    private readonly mongoEntityConverter: MongoEntityConverter,
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return RUNDOWN_COLLECTION_NAME
  }

  public async getBasicRundowns(): Promise<BasicRundown[]> {
    this.assertDatabaseConnection(this.getBasicRundowns.name)
    const basicRundowns: MongoRundown[] = (await this.getCollection()
      .find({})
      .project({ _id: 1, name: 1, modifiedAt: 1, mode: 1, timing: 1 })
      .toArray()) as unknown as MongoRundown[]
    return this.mongoEntityConverter.convertToBasicRundowns(basicRundowns)
  }

  public async getRundown(rundownId: string): Promise<Rundown> {
    this.assertDatabaseConnection(this.getRundown.name)
    const mongoRundown: MongoRundown | null = await this.getCollection().findOne<MongoRundown>({
      _id: rundownId
    })
    if (!mongoRundown) {
      throw new NotFoundException(`No Rundown found in database for RundownId ${rundownId}`)
    }

    const infinitePieces: Piece[] = await this.mongoPieceRepository.getPiecesFromIds(mongoRundown.infinitePieceIds)
    const segments: Segment[] = await this.mongoSegmentRepository.getSegments(mongoRundown._id)
    return this.mongoEntityConverter.convertToRundown(mongoRundown, segments, infinitePieces)
  }

  public getRundownBySegmentId(ingestedSegmentId: string): Promise<Rundown> {
    throw new UnsupportedOperationException(`${MongoRundownRepository.name} does not support getting a Rundown from an Ingested Segment id. Trying to find Rundown with Segment id: ${ingestedSegmentId}`)
  }

  public async saveRundown(rundown: Rundown): Promise<void> {
    this.assertDatabaseConnection(this.saveRundown.name)

    const mongoRundown: MongoRundown = this.mongoEntityConverter.convertToMongoRundown(rundown)
    const segments: readonly Segment[] = rundown.getSegments()
    const saveSegmentQueries: readonly { updateOne: UpdateOneModel<MongoSegment> }[] = this.mongoSegmentRepository.buildSaveSegmentQueries(rundown.getSegments())
    const parts: readonly Part[] = segments.flatMap(segment => segment.getParts())
    const savePartQueries: readonly { updateOne: UpdateOneModel<MongoPart> }[] = this.mongoPartRepository.buildSavePartQueries(parts)
    const pieces: readonly Piece[] = parts.flatMap(part => part.getPieces())
    const savePieceQueries: readonly { updateOne: UpdateOneModel<MongoPiece> }[] = this.mongoPieceRepository.buildSavePieceQueries(pieces)

    const mongoClient: MongoClient = this.mongoDatabase.getClient()
    await mongoClient.withSession(async (session) => {
      await session.withTransaction(async (session) => {
        await this.getCollection().updateOne({ _id: mongoRundown._id }, { $set: mongoRundown }, { upsert: true, ignoreUndefined: true })
        await this.mongoSegmentRepository.executeQueries(saveSegmentQueries, session)
        await this.mongoPartRepository.executeQueries(savePartQueries, session)
        await this.mongoPieceRepository.executeQueries(savePieceQueries, session)
      })
    })
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteRundown.name)
    const doesRundownExist: boolean = await this.doesRundownExist(rundownId)
    if (!doesRundownExist) {
      return
    }

    await this.mongoSegmentRepository.deleteSegmentsForRundown(rundownId)
    const rundownDeletionResult: DeleteResult = await this.getCollection().deleteOne({
      _id: rundownId,
    })
    if (!rundownDeletionResult.acknowledged) {
      throw new DeletionFailedException(`Deletion of rundown was not acknowledged, for rundownId: ${rundownId}`)
    }
  }

  private async doesRundownExist(rundownId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: rundownId })) === 1
  }
}
