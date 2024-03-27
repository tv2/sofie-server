import { Rundown } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoDatabase } from './mongo-database'
import { SegmentRepository } from '../interfaces/segment-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { DeleteResult } from 'mongodb'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'
import { PieceRepository } from '../interfaces/piece-repository'
import { Piece } from '../../../model/entities/piece'
import { Segment } from '../../../model/entities/segment'
import { MongoEntityConverter, MongoRundown } from './mongo-entity-converter'

export const RUNDOWN_COLLECTION_NAME: string = 'executedRundowns' // TODO: Once we control ingest renamed this to "rundowns".

export class MongoRundownRepository extends BaseMongoRepository implements RundownRepository {

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoEntityConverter: MongoEntityConverter,
    private readonly segmentRepository: SegmentRepository,
    private readonly pieceRepository: PieceRepository
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

    const infinitePieces: Piece[] = await this.pieceRepository.getPiecesFromIds(mongoRundown.infinitePieceIds)
    const segments: Segment[] = await this.segmentRepository.getSegments(mongoRundown._id)
    return this.mongoEntityConverter.convertToRundown(mongoRundown, segments, infinitePieces)
  }

  public getRundownBySegmentId(ingestedSegmentId: string): Promise<Rundown> {
    throw new UnsupportedOperationException(`${MongoRundownRepository.name} does not support getting a Rundown from an Ingested Segment id. Trying to find Rundown with Segment id: ${ingestedSegmentId}`)
  }

  public async saveRundown(rundown: Rundown): Promise<void> {
    this.assertDatabaseConnection(this.saveRundown.name)
    const mongoRundown: MongoRundown = this.mongoEntityConverter.convertToMongoRundown(rundown)
    await this.getCollection().updateOne({ _id: mongoRundown._id }, { $set: mongoRundown }, { upsert: true, ignoreUndefined: true })

    await Promise.all([
      ...rundown.getSegments().map(segment => this.segmentRepository.saveSegment(segment)),
    ])
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteRundown.name)
    const doesRundownExist: boolean = await this.doesRundownExist(rundownId)
    if (!doesRundownExist) {
      return
    }

    await this.segmentRepository.deleteSegmentsForRundown(rundownId)
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
