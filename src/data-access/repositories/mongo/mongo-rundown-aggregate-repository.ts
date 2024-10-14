import { Rundown } from '../../../model/entities/rundown'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { AnyBulkWriteOperation, ClientSession } from 'mongodb'
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

    const infinitePieces: Piece[] = await this.mongoPieceRepository.getPiecesFromIds(mongoRundown.infinitePieceIds)
    const segments: Segment[] = await this.mongoSegmentRepository.getSegments(mongoRundown._id)
    return this.mongoEntityConverter.convertToRundown(mongoRundown, segments, infinitePieces)
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
    const pieces: readonly Piece[] = parts.flatMap(part => part.getPieces())
    const savePieceQueries: readonly AnyBulkWriteOperation<MongoPiece>[] = this.mongoPieceRepository.buildSavePieceQueries(pieces)
    const deleteOrphanedPiecesQuery: AnyBulkWriteOperation<MongoPiece> = this.mongoPieceRepository.buildDeleteOrphanedPiecesForPartsQuery(parts.map(part => part.id), pieces.concat(rundown.getInfinitePieces()))

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

    const partIdsForRundown: readonly string[] = await this.mongoPartRepository.getPartIdsForRundown(rundownId)
    await this.withTransaction(async (session) => {
      await this.mongoPieceRepository.executeQueries([this.mongoPieceRepository.buildDeletePiecesForRundownQuery(partIdsForRundown)], session)
      await this.mongoPartRepository.executeQueries([this.mongoPartRepository.buildDeletePartsForRundownQuery(rundownId)], session)
      await this.mongoSegmentRepository.executeQueries([this.mongoSegmentRepository.buildDeleteSegmentsForRundownQuery(rundownId)], session)
      await this.getCollection().deleteOne({ _id: rundownId })
    })
  }

  private async doesRundownExist(rundownId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: rundownId })) === 1
  }

  public getSegment(segmentId: string): Promise<Segment> {
    return this.mongoSegmentRepository.getSegment(segmentId)
  }

  public async deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteUnsyncedSegmentsForRundown.name)
    const segments: Segment[] = await this.mongoSegmentRepository.getSegments(rundownId, { isUnsynced: true })
    const parts: readonly Part[] = segments.flatMap(segment => segment.getParts())

    const deletePartQueries: AnyBulkWriteOperation<MongoPart>[] = segments.map(segment => this.mongoPartRepository.buildDeletePartsForSegmentQuery(segment.id))

    await this.withTransaction(async (session) => {
      await this.mongoPieceRepository.executeQueries(parts.map(part => this.mongoPieceRepository.buildDeletePiecesForPartQuery(part.id)), session)
      await this.mongoPartRepository.executeQueries(deletePartQueries, session)
      await this.mongoSegmentRepository.executeQueries([this.mongoSegmentRepository.buildDeleteUnsyncedSegmentsForRundownQuery(rundownId)], session)
    })
  }

  public getPart(partId: string): Promise<Part> {
    return this.mongoPartRepository.getPart(partId)
  }

  public async deletePart(partId: string): Promise<void> {
    this.assertDatabaseConnection(this.deletePart.name)
    await this.withTransaction(async (session) => {
      await this.mongoPartRepository.executeQueries([this.mongoPartRepository.buildDeletePartQuery(partId)], session)
      await this.mongoPieceRepository.executeQueries([this.mongoPieceRepository.buildDeletePiecesForPartQuery(partId)], session)
    })
  }

  public async deleteParts(partIds: readonly string[]): Promise<void> {
    this.assertDatabaseConnection(this.deleteParts.name)
    await this.withTransaction(async (session) => {
      await this.mongoPartRepository.executeQueries(partIds.map(partId => this.mongoPartRepository.buildDeletePartQuery(partId)), session)
      await this.mongoPieceRepository.executeQueries(partIds.map(partId => this.mongoPieceRepository.buildDeletePiecesForPartQuery(partId)), session)
    })
  }

  public async deleteUnsyncedPartsForSegment(segmentId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteUnsyncedPartsForSegment.name)
    const partIdsInSegment: readonly string[] = await this.mongoPartRepository.getPartIdsForSegment(segmentId)
    await this.withTransaction(async (session) => {
      await this.mongoPartRepository.executeQueries([this.mongoPartRepository.buildDeleteUnsyncedPartsForSegmentQuery(segmentId)], session)
      await this.mongoPieceRepository.executeQueries(partIdsInSegment.map(partId => this.mongoPieceRepository.buildDeletePiecesForPartQuery(partId)), session)
    })
  }

  private withTransaction(callback: (session: ClientSession) => Promise<void>): Promise<void> {
    return this.mongoDatabase.getClient().withSession(session => session.withTransaction(session => callback(session)))
  }

  public getPiecesFromIds(pieceIds: string[]): Promise<Piece[]> {
    return this.mongoPieceRepository.getPiecesFromIds(pieceIds)
  }
}
