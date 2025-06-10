import { Segment } from '../../../rundown-execution/domain/entities/segment'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { AnyBulkWriteOperation, } from 'mongodb'
import { NotFoundException } from '../../../rundown-execution/domain/exceptions/not-found-exception'
import { Part } from '../../../rundown-execution/domain/entities/part'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { MongoPartRepository } from './mongo-part-repository'

const SEGMENT_COLLECTION_NAME: string = 'executedSegments' // TODO: Once we control ingest rename to "segments".

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

  public async getSegments(rundownId: string, filters?: Partial<MongoSegment>): Promise<Segment[]> {
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

  public buildSaveSegmentQueries(segments: readonly Segment[]): AnyBulkWriteOperation<MongoSegment>[] {
    return segments.map(segment => this.buildSaveSegmentQuery(segment))
  }

  public buildDeleteOrphanedSegmentsForRundownQuery(rundownId: string, segments: readonly Segment[]): AnyBulkWriteOperation<MongoSegment> {
    return {
      deleteMany: {
        filter: { rundownId, _id: { $nin: segments.map(segment => segment.id) } }
      }
    }
  }

  private buildSaveSegmentQuery(segment: Segment): AnyBulkWriteOperation<MongoSegment> {
    const mongoSegment: MongoSegment = this.mongoEntityConverter.convertToMongoSegment(segment)
    return {
      updateOne: {
        filter: { _id: mongoSegment._id },
        update: { $set: mongoSegment },
        upsert: true
      }
    }
  }

  public buildDeleteSegmentsForRundownQuery(rundownId: string): AnyBulkWriteOperation<MongoSegment> {
    return {
      deleteMany: {
        filter: { rundownId },
      },
    }
  }
}
