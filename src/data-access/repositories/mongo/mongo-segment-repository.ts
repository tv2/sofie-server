import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment } from '../../../model/entities/segment'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedSegment } from './mongo-ingested-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import {
  AnyBulkWriteOperation,
  ClientSession, DeleteManyModel,
  DeleteResult,
  MongoClient,
  UpdateOneModel
} from 'mongodb'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Part } from '../../../model/entities/part'
import { MongoEntityConverter, MongoPart, MongoPiece, MongoSegment } from './mongo-entity-converter'
import { MongoPartRepository } from './mongo-part-repository'
import { MongoPieceRepository } from './mongo-piece-repository'
import { Piece } from '../../../model/entities/piece'

export const SEGMENT_COLLECTION_NAME: string = 'executedSegments' // TODO: Once we control ingest rename to "segments".

export class MongoSegmentRepository extends BaseMongoRepository<MongoSegment> implements SegmentRepository {
  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoPartRepository: MongoPartRepository,
    private readonly mongoPieceRepository: MongoPieceRepository,
    private readonly mongoEntityConverter: MongoEntityConverter,
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return SEGMENT_COLLECTION_NAME
  }

  public async getSegment(segmentId: string): Promise<Segment> {
    this.assertDatabaseConnection(this.getSegment.name)
    const mongoSegment: MongoSegment | null = await this.getCollection().findOne<MongoSegment>({
      _id: segmentId
    })
    if (!mongoSegment) {
      throw new NotFoundException(`No Segment found for SegmentId ${segmentId}`)
    }
    const segment: Segment = this.mongoEntityConverter.convertToSegment(mongoSegment)
    const parts: Part[] = await this.mongoPartRepository.getParts(segment.id)
    segment.setParts(parts)
    return segment
  }

  public async getSegments(rundownId: string, filters?: Partial<MongoIngestedSegment>): Promise<Segment[]> {
    this.assertDatabaseConnection(this.getSegments.name)
    const mongoSegments: MongoSegment[] = (await this.getCollection()
      .find<MongoSegment>({ ...filters, rundownId: rundownId })
      .toArray())
    const segments: Segment[] = this.mongoEntityConverter.convertToSegments(mongoSegments)
    return Promise.all(
      segments.map(async (segment) => {
        segment.setParts(await this.mongoPartRepository.getParts(segment.id))
        return segment
      })
    )
  }

  public buildSaveSegmentQueries(segments: readonly Segment[]): { updateOne: UpdateOneModel<MongoSegment> }[] {
    return segments.map(segment => this.buildSaveSegmentQuery(segment))
  }

  private buildSaveSegmentQuery(segment: Segment): { updateOne: UpdateOneModel<MongoSegment> } {
    const mongoSegment: MongoSegment = this.mongoEntityConverter.convertToMongoSegment(segment)
    return {
      updateOne: {
        filter: { _id: mongoSegment._id },
        update: { $set: mongoSegment },
        upsert: true
      }
    }
  }

  public async executeQueries(queries: readonly AnyBulkWriteOperation<MongoSegment>[], session: ClientSession): Promise<void> {
    await this.getCollection().bulkWrite([...queries], { session, ignoreUndefined: true })
  }

  public async saveSegment(segment: Segment): Promise<void> {
    this.assertDatabaseConnection(this.saveSegment.name)

    const mongoSegment: MongoSegment = this.mongoEntityConverter.convertToMongoSegment(segment)
    const parts: readonly Part[] = segment.getParts()
    const savePartQueries: readonly { updateOne: UpdateOneModel<MongoPart> }[] = this.mongoPartRepository.buildSavePartQueries(parts)
    const pieces: readonly Piece[] = parts.flatMap(part => part.getPieces())
    const savePieceQueries: readonly { updateOne: UpdateOneModel<MongoPiece> }[] = this.mongoPieceRepository.buildSavePieceQueries(pieces)

    const mongoClient: MongoClient = this.mongoDatabase.getClient()
    await mongoClient.withSession(async (session) => {
      await session.withTransaction(async (session) => {
        await this.getCollection().updateOne({ _id: mongoSegment._id }, { $set: mongoSegment }, { upsert: true, ignoreUndefined: true })
        await this.mongoPartRepository.executeQueries(savePartQueries, session)
        await this.mongoPieceRepository.executeQueries(savePieceQueries, session)
      })
    })
  }

  public buildDeleteSegmentsForRundownQuery(rundownId: string): { deleteMany: DeleteManyModel<MongoSegment> } {
    return {
      deleteMany: {
        filter: { rundownId },
      },
    }
  }

  public async deleteSegmentsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteSegmentsForRundown.name)
    const segments: Segment[] = await this.getSegments(rundownId)

    await Promise.all(segments.map(async (segment) => this.mongoPartRepository.deletePartsForSegment(segment.id)))

    const segmentDeleteResult: DeleteResult = await this.getCollection().deleteMany({ rundownId: rundownId })

    if (!segmentDeleteResult.acknowledged) {
      throw new DeletionFailedException(`Failed to delete Segments for Rundown: ${rundownId}`)
    }
  }

  public async deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteUnsyncedSegmentsForRundown.name)
    const unsyncedFilter: Partial<MongoSegment> = { isUnsynced: true }
    const segments: Segment[] = await this.getSegments(rundownId, unsyncedFilter)

    const deletePartQueries: AnyBulkWriteOperation<MongoPart>[] = segments.map(segment => this.mongoPartRepository.buildDeletePartsForSegmentQuery(segment.id))

    const mongoClient: MongoClient = this.mongoDatabase.getClient()
    await mongoClient.withSession(async (session) => {
      await session.withTransaction(async (session) => {
        await this.mongoPartRepository.executeQueries(deletePartQueries, session)
        await this.getCollection().deleteMany({ ...unsyncedFilter, rundownId: rundownId })
      })
    })
  }

  /*
  * NOTE: This will delete ALL unsynced Segments in the database. Should only be used on deactivate or activate Rundown.
  * NOTE: This will NOT delete the associated Parts.
  */
  public async deleteAllUnsyncedSegments(): Promise<void> {
    this.assertDatabaseConnection(this.deleteAllUnsyncedSegments.name)
    await this.getCollection().deleteMany({
      isUnsynced: true
    })
  }
}
