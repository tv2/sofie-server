import { MongoDatabase } from './mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedRundown } from './mongo-ingested-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { IngestedRundownRepository } from '../interfaces/ingested-rundown-repository'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { RundownBaselineRepository } from '../interfaces/rundown-baseline-repository'
import { IngestedSegmentRepository } from '../interfaces/ingested-segment-repository'
import { IngestedRundown } from '../../../model/entities/ingested-rundown'

const INGESTED_RUNDOWN_COLLECTION_NAME: string = 'rundowns' // TODO: Once we control ingest this should be renamed to "ingestedRundowns".

export class MongoIngestedRundownRepository extends BaseMongoRepository implements IngestedRundownRepository {

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    private readonly rundownBaselineRepository: RundownBaselineRepository,
    private readonly ingestedSegmentRepository: IngestedSegmentRepository
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return INGESTED_RUNDOWN_COLLECTION_NAME
  }

  public async getIngestedRundowns(): Promise<IngestedRundown[]> {
    this.assertDatabaseConnection(this.getIngestedRundowns.name)
    const mongoIngestedRundowns: MongoIngestedRundown[] = await this.getCollection().find<MongoIngestedRundown>({}).toArray()
    return Promise.all(mongoIngestedRundowns.map(mongoIngestedRundown => this.populateIngestedRundown(mongoIngestedRundown)))
  }

  private async populateIngestedRundown(mongoIngestedRundown: MongoIngestedRundown): Promise<IngestedRundown> {
    const ingestedRundown: IngestedRundown = this.mongoIngestedEntityConverter.convertRundown(mongoIngestedRundown)

    ingestedRundown.ingestedSegments = await this.ingestedSegmentRepository.getIngestedSegments(ingestedRundown.id)
    ingestedRundown.baselineTimelineObjects = await this.rundownBaselineRepository.getRundownBaseline(
      ingestedRundown.id
    )
    return ingestedRundown
  }

  public async getIngestedRundown(rundownId: string): Promise<IngestedRundown> {
    this.assertDatabaseConnection(this.getIngestedRundown.name)
    const mongoRundown: MongoIngestedRundown | null = await this.getCollection().findOne<MongoIngestedRundown>({
      _id: rundownId,
    })
    if (!mongoRundown) {
      throw new NotFoundException(`No Rundown found for ingestRundownId: ${rundownId}`)
    }
    const ingestedRundown: IngestedRundown = this.mongoIngestedEntityConverter.convertRundown(mongoRundown)

    ingestedRundown.ingestedSegments = await this.ingestedSegmentRepository.getIngestedSegments(rundownId)
    ingestedRundown.baselineTimelineObjects = await this.rundownBaselineRepository.getRundownBaseline(
      rundownId
    )
    return ingestedRundown
  }

  public async deleteIngestedRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedRundown.name)
    await this.ingestedSegmentRepository.deleteIngestedSegmentsForRundown(rundownId)
    await this.getCollection().deleteOne({ _id: rundownId })
  }
}
