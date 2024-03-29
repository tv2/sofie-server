import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment } from '../../../model/entities/segment'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedSegment } from './mongo-ingested-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { DeleteResult } from 'mongodb'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Part } from '../../../model/entities/part'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'

export const SEGMENT_COLLECTION_NAME: string = 'executedSegments' // TODO: Once we control ingest rename to "segments".

export class MongoSegmentRepository extends BaseMongoRepository implements SegmentRepository {
  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoEntityConverter: MongoEntityConverter,
    private readonly partRepository: PartRepository
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
    const parts: Part[] = await this.partRepository.getParts(segment.id)
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
        segment.setParts(await this.partRepository.getParts(segment.id))
        return segment
      })
    )
  }

  public async saveSegment(segment: Segment): Promise<void> {
    const mongoSegment: MongoSegment = this.mongoEntityConverter.convertToMongoSegment(segment)
    await this.getCollection().updateOne(
      { _id: mongoSegment._id },
      { $set: mongoSegment },
      { upsert: true, ignoreUndefined: true }
    )
    await Promise.all(segment.getParts().map(part => this.partRepository.savePart(part)))
  }

  public async delete(segmentId: string): Promise<void> {
    await this.partRepository.deletePartsForSegment(segmentId)
    await this.getCollection().deleteMany({ _id: segmentId })
  }

  public async deleteSegmentsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteSegmentsForRundown.name)
    const segments: Segment[] = await this.getSegments(rundownId)

    await Promise.all(segments.map(async (segment) => this.partRepository.deletePartsForSegment(segment.id)))

    const segmentDeleteResult: DeleteResult = await this.getCollection().deleteMany({ rundownId: rundownId })

    if (!segmentDeleteResult.acknowledged) {
      throw new DeletionFailedException(`Failed to delete Segments for Rundown: ${rundownId}`)
    }
  }

  public async deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteUnsyncedSegmentsForRundown.name)
    const unsyncedFilter: Partial<MongoSegment> = { isUnsynced: true }
    const segments: Segment[] = await this.getSegments(rundownId, unsyncedFilter)

    await Promise.all(segments.map(async (segment) => this.partRepository.deletePartsForSegment(segment.id)))

    const segmentDeleteResult: DeleteResult = await this.getCollection().deleteMany({ ...unsyncedFilter, rundownId: rundownId })

    if (!segmentDeleteResult.acknowledged) {
      throw new DeletionFailedException(`Failed to delete Segments for Rundown: ${rundownId}`)
    }
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
