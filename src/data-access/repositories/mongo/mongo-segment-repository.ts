import { Segment } from '../../../model/entities/segment'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedSegment } from './mongo-ingested-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import {
  AnyBulkWriteOperation,
  ClientSession, DeleteManyModel,
  MongoClient,
  UpdateOneModel
} from 'mongodb'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Part } from '../../../model/entities/part'
import { MongoEntityConverter, MongoPart, MongoSegment } from './mongo-entity-converter'
import { MongoPartRepository } from './mongo-part-repository'

export const SEGMENT_COLLECTION_NAME: string = 'executedSegments' // TODO: Once we control ingest rename to "segments".

export class MongoSegmentRepository extends BaseMongoRepository<MongoSegment> {
  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoPartRepository: MongoPartRepository,
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
    if (queries.length === 0) {
      return
    }
    await this.getCollection().bulkWrite([...queries], { session, ignoreUndefined: true })
  }

  public buildDeleteSegmentsForRundownQuery(rundownId: string): { deleteMany: DeleteManyModel<MongoSegment> } {
    return {
      deleteMany: {
        filter: { rundownId },
      },
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

  public buildDeleteAllUnsyncedSegmentsQuery(): AnyBulkWriteOperation<MongoSegment> {
    return {
      deleteMany: {
        filter: { isUnsynced: true },
      }
    }
  }
}
