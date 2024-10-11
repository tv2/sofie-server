import { Rundown } from '../../../model/entities/rundown'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { DeleteManyModel, MongoClient, UpdateOneModel } from 'mongodb'
import { Piece } from '../../../model/entities/piece'
import { Segment } from '../../../model/entities/segment'
import { MongoEntityConverter, MongoPart, MongoPiece, MongoRundown, MongoSegment } from './mongo-entity-converter'
import { MongoSegmentRepository } from './mongo-segment-repository'
import { MongoPartRepository } from './mongo-part-repository'
import { MongoPieceRepository } from './mongo-piece-repository'
import { Part } from '../../../model/entities/part'
import { RundownAggregateRepository } from '../interfaces/rundown-aggregate-repository'

export const RUNDOWN_COLLECTION_NAME: string = 'executedRundowns' // TODO: Once we control ingest renamed this to "rundowns".

export class MongoRundownAggregateRepository extends BaseMongoRepository<MongoRundown> implements RundownAggregateRepository {

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

    const deleteSegmentsQuery: { deleteMany: DeleteManyModel<MongoSegment> } = this.mongoSegmentRepository.buildDeleteSegmentsForRundownQuery(rundownId)
    const deletePartsQuery: { deleteMany: DeleteManyModel<MongoPart> } = this.mongoPartRepository.buildDeletePartsForRundownQuery(rundownId)
    const partIdsForRundown: readonly string[] = await this.mongoPartRepository.getPartIdsForRundown(rundownId)
    const deletePiecesQuery: { deleteMany: DeleteManyModel<MongoPiece> } = this.mongoPieceRepository.buildDeletePiecesForRundownQuery(partIdsForRundown)

    const mongoClient: MongoClient = this.mongoDatabase.getClient()
    await mongoClient.withSession(async (session) => {
      await session.withTransaction(async (session) => {
        await this.mongoPieceRepository.executeQueries([deletePiecesQuery], session)
        await this.mongoPartRepository.executeQueries([deletePartsQuery], session)
        await this.mongoSegmentRepository.executeQueries([deleteSegmentsQuery], session)
        await this.getCollection().deleteOne({ _id: rundownId })
      })
    })
  }

  private async doesRundownExist(rundownId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: rundownId })) === 1
  }

  public getSegment(segmentId: string): Promise<Segment> {
    return this.mongoSegmentRepository.getSegment(segmentId)
  }

  public deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void> {
    return this.mongoSegmentRepository.deleteUnsyncedSegmentsForRundown(rundownId)
  }

  public deleteAllUnsyncedSegments(): Promise<void> {
    return this.mongoSegmentRepository.deleteAllUnsyncedSegments()
  }

  public getPart(partId: string): Promise<Part> {
    return this.mongoPartRepository.getPart(partId)
  }

  public deletePart(partId: string): Promise<void> {
    return this.mongoPartRepository.deletePart(partId)
  }

  public deleteUnsyncedPartsForSegment(segmentId: string): Promise<void> {
    return this.mongoPartRepository.deleteUnsyncedPartsForSegment(segmentId)
  }

  public deleteAllUnsyncedParts(): Promise<void> {
    return this.mongoPartRepository.deleteAllUnsyncedParts()
  }

  public deleteAllUnplannedParts(): Promise<void> {
    return this.mongoPartRepository.deleteAllUnplannedParts()
  }

  public getPiecesFromIds(pieceIds: string[]): Promise<Piece[]> {
    return this.mongoPieceRepository.getPiecesFromIds(pieceIds)
  }

  public deleteUnsyncedInfinitePiecesNotOnAnyRundown(): Promise<void> {
    return this.mongoPieceRepository.deleteUnsyncedInfinitePiecesNotOnAnyRundown()
  }

  public deleteAllUnsyncedPieces(): Promise<void> {
    return this.mongoPieceRepository.deleteAllUnplannedPieces()
  }

  public deleteAllUnplannedPieces(): Promise<void> {
    return this.mongoPieceRepository.deleteAllUnplannedPieces()
  }
}
