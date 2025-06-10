import { Rundown } from '../../../rundown-execution/domain/entities/rundown'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { BasicRundown } from '../../../rundown-execution/domain/entities/basic-rundown'
import { NotFoundException } from '../../../rundown-execution/domain/exceptions/not-found-exception'
import { AnyBulkWriteOperation, ClientSession } from 'mongodb'
import { Piece } from '../../../rundown-execution/domain/entities/piece'
import { Segment } from '../../../rundown-execution/domain/entities/segment'
import { MongoEntityConverter, MongoPart, MongoPiece, MongoRundown, MongoSegment } from './mongo-entity-converter'
import { MongoSegmentRepository } from './mongo-segment-repository'
import { MongoPartRepository } from './mongo-part-repository'
import { MongoPieceRepository } from './mongo-piece-repository'
import { Part } from '../../../rundown-execution/domain/entities/part'
import { RundownAggregateRepository } from '../interfaces/rundown-aggregate-repository'
import { MongoExpectedPlayoutItemRepository } from './mongo-expected-playout-item-repository'

const RUNDOWN_COLLECTION_NAME: string = 'executedRundowns' // TODO: Once we control ingest renamed this to "rundowns".

export class MongoRundownAggregateRepository extends BaseMongoRepository<MongoRundown> implements RundownAggregateRepository {

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoSegmentRepository: MongoSegmentRepository,
    private readonly mongoPartRepository: MongoPartRepository,
    private readonly mongoPieceRepository: MongoPieceRepository,
    private readonly mongoExpectedPlayoutItemRepository: MongoExpectedPlayoutItemRepository,
    private readonly mongoEntityConverter: MongoEntityConverter
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return RUNDOWN_COLLECTION_NAME
  }

  public getBasicRundowns(): Promise<BasicRundown[]> {
    this.assertDatabaseConnection(this.getBasicRundowns.name)
    return this.getCollection()
      .find({})
      .project<MongoRundown>({ _id: 1, name: 1, modifiedAt: 1, mode: 1, timing: 1 })
      .map(basicMongoRundown => this.mongoEntityConverter.convertToBasicRundown(basicMongoRundown))
      .toArray()
  }

  public async getRundown(rundownId: string): Promise<Rundown> {
    this.assertDatabaseConnection(this.getRundown.name)
    const mongoRundown: MongoRundown | null = await this.getCollection().findOne<MongoRundown>({
      _id: rundownId
    })
    if (!mongoRundown) {
      throw new NotFoundException(`No Rundown found in database for RundownId ${rundownId}`)
    }

    const baselinePieces: Piece[] = await this.mongoPieceRepository.getPiecesFromIds(mongoRundown.baselinePieceIds)
    const infinitePieces: Piece[] = await this.mongoPieceRepository.getPiecesFromIds(mongoRundown.infinitePieceIds)
    const segments: Segment[] = await this.mongoSegmentRepository.getSegments(mongoRundown._id)
    return this.mongoEntityConverter.convertToRundown(mongoRundown, segments, baselinePieces, infinitePieces)
  }

  public async saveRundown(rundown: Rundown): Promise<void> {
    this.assertDatabaseConnection(this.saveRundown.name)

    const mongoRundown: MongoRundown = this.mongoEntityConverter.convertToMongoRundown(rundown)
    const segments: readonly Segment[] = rundown.getSegments()
    const saveSegmentQueries: readonly AnyBulkWriteOperation<MongoSegment>[] = this.mongoSegmentRepository.buildSaveSegmentQueries(rundown.getSegments())
    const deleteOrphanedSegmentsQuery: AnyBulkWriteOperation<MongoSegment> = this.mongoSegmentRepository.buildDeleteOrphanedSegmentsForRundownQuery(rundown.id, segments)
    const parts: readonly Part[] = segments.flatMap(segment => segment.getParts())
    const savePartQueries: readonly AnyBulkWriteOperation<MongoPart>[] = this.mongoPartRepository.buildSavePartQueries(parts)
    const deleteOrphanedPartsQuery: AnyBulkWriteOperation<MongoPart> = this.mongoPartRepository.buildDeleteOrphanedPartsForRundownQuery(rundown.id, parts)
    const pieces: readonly Piece[] = rundown.getBaselinePieces().concat(parts.flatMap(part => part.getPieces()))
    const savePieceQueries: readonly AnyBulkWriteOperation<MongoPiece>[] = this.mongoPieceRepository.buildSavePieceQueries(pieces)
    const deleteOrphanedPiecesQuery: AnyBulkWriteOperation<MongoPiece> = this.mongoPieceRepository.buildDeleteOrphanedPiecesForRundownQuery(rundown.id, pieces.concat(rundown.getInfinitePieces()))

    await this.withTransaction(async (session) => {
      await this.getCollection().updateOne({ _id: mongoRundown._id }, { $set: mongoRundown }, { upsert: true, ignoreUndefined: true })
      await this.mongoSegmentRepository.executeQueries(saveSegmentQueries.concat(deleteOrphanedSegmentsQuery), session)
      await this.mongoPartRepository.executeQueries(savePartQueries.concat(deleteOrphanedPartsQuery), session)
      await this.mongoPieceRepository.executeQueries(savePieceQueries.concat(deleteOrphanedPiecesQuery), session)
    })
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteRundown.name)
    const doesRundownExist: boolean = await this.doesRundownExist(rundownId)
    if (!doesRundownExist) {
      return
    }

    await this.withTransaction(async (session) => {
      await this.mongoPieceRepository.executeQueries([this.mongoPieceRepository.buildDeletePiecesForRundownQuery(rundownId)], session)
      await this.mongoPartRepository.executeQueries([this.mongoPartRepository.buildDeletePartsForRundownQuery(rundownId)], session)
      await this.mongoSegmentRepository.executeQueries([this.mongoSegmentRepository.buildDeleteSegmentsForRundownQuery(rundownId)], session)
      await this.mongoExpectedPlayoutItemRepository.executeQueries([this.mongoExpectedPlayoutItemRepository.buildDeleteExpectedPlayoutItemsForRundownQuery(rundownId)], session)
      await this.getCollection().deleteOne({ _id: rundownId })
    })
  }

  private async doesRundownExist(rundownId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: rundownId })) === 1
  }

  public getSegment(segmentId: string): Promise<Segment> {
    return this.mongoSegmentRepository.getSegment(segmentId)
  }

  public getPart(partId: string): Promise<Part> {
    return this.mongoPartRepository.getPart(partId)
  }

  private withTransaction(callback: (session: ClientSession) => Promise<void>): Promise<void> {
    return this.mongoDatabase.getClient().withSession(session => session.withTransaction(session => callback(session)))
  }

  public getPiece(pieceId: string): Promise<Piece> {
    return this.mongoPieceRepository.getPiece(pieceId)
  }
}
