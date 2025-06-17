import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { IngestedSegmentRepository } from '../../../domain/repositories/ingested-segment-repository'
import { IngestedSegment } from '../../../../rundown-execution/domain/entities/ingested-segment'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedSegment } from '../../../../rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-entity-converter'
import { IngestedPartRepository } from '../../../domain/repositories/ingested-part-repository'
import { IngestedPart } from '../../../../rundown-execution/domain/entities/ingested-part'

const INGESTED_SEGMENT_COLLECTION_NAME: string = 'segments' // TODO: Once we control ingest rename to "ingestedSegments".

export class MongoIngestedSegmentRepository extends BaseMongoRepository<MongoIngestedSegment> implements IngestedSegmentRepository {
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

  public async getIngestedSegmentsForRundown(rundownId: string, ingestedParts: readonly IngestedPart[]): Promise<IngestedSegment[]> {
    this.assertDatabaseConnection(this.getIngestedSegmentsForRundown.name)
    return this.getCollection()
      .find<MongoIngestedSegment>({ rundownId: rundownId })
      .map(mongoIngestedSegment => ({
        ...this.mongoIngestedEntityConverter.convertToIngestedSegment(mongoIngestedSegment),
        ingestedParts: ingestedParts.filter(ingestedPart => ingestedPart.segmentId === mongoIngestedSegment._id)
      }))
      .toArray()
  }

  public async deleteIngestedSegmentsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedSegmentsForRundown.name)
    await this.ingestedPartRepository.deleteIngestedPartsForRundown(rundownId)
    await this.getCollection().deleteMany({ rundownId: rundownId })
  }
}
