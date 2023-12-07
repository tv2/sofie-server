import { BaseMongoRepository } from './base-mongo-repository'
import { IngestedSegmentRepository } from '../interfaces/ingested-segment-repository'
import { IngestedSegment } from '../../../model/entities/ingested-segment'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedSegment } from './mongo-ingested-entity-converter'
import { IngestedPartRepository } from '../interfaces/ingested-part-repository'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const INGESTED_SEGMENT_COLLECTION_NAME: string = 'segments' // TODO: Once we control ingest rename to "ingestedSegments".

export class MongoIngestedSegmentRepository extends BaseMongoRepository implements IngestedSegmentRepository {

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    private readonly ingestedPartRepository: IngestedPartRepository
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return INGESTED_SEGMENT_COLLECTION_NAME
  }

  public async getIngestedSegment(segmentId: string): Promise<IngestedSegment> {
    this.assertDatabaseConnection(this.getIngestedSegment.name)
    const mongoSegment: MongoIngestedSegment | null = await this.getCollection().findOne<MongoIngestedSegment>({
      _id: segmentId
    })
    if (!mongoSegment) {
      throw new NotFoundException(`No Segment found for segmentId: ${segmentId}`)
    }
    return {
      ...this.mongoIngestedEntityConverter.convertToIngestedSegment(mongoSegment),
      ingestedParts: await this.ingestedPartRepository.getIngestedPartsForSegment(mongoSegment._id)
    }
  }

  public async getIngestedSegmentsForRundown(rundownId: string): Promise<IngestedSegment[]> {
    this.assertDatabaseConnection(this.getIngestedSegmentsForRundown.name)
    const mongoSegments: MongoIngestedSegment[] = (await this.getCollection()
      .find<MongoIngestedSegment>({ rundownId: rundownId })
      .toArray())
    const ingestedSegments: IngestedSegment[] = this.mongoIngestedEntityConverter.convertToIngestedSegments(mongoSegments)
    return Promise.all(
      ingestedSegments.map(async (segment) => {
        return {
          ...segment,
          ingestedParts: await this.ingestedPartRepository.getIngestedPartsForSegment(segment.id)
        }
      })
    )
  }

  public async deleteIngestedSegmentsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedSegmentsForRundown.name)
    await this.ingestedPartRepository.deleteIngestedPartsForRundown(rundownId)
    await this.getCollection().deleteMany({ rundownId: rundownId })
  }
}
