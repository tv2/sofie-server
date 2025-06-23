import { TimelineRepository } from '../../../domain/repositories/timeline-repository'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { Timeline } from '../../../domain/entities/timeline'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { NotFoundException } from '../../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { MongoTimeline, RundownExecutionMongoEntityConverter } from './rundown-execution-mongo-entity-converter'

const TIMELINE_COLLECTION_NAME: string = 'timeline'

export class MongoTimelineRepository extends BaseMongoRepository<MongoTimeline> implements TimelineRepository {
  public constructor(mongoDatabase: MongoDatabase, private readonly rundownExecutionMongoEntityConverter: RundownExecutionMongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return TIMELINE_COLLECTION_NAME
  }

  public async getTimeline(): Promise<Timeline> {
    const mongoTimeline: MongoTimeline | null = await this.getCollection().findOne<MongoTimeline>()
    if (!mongoTimeline) {
      throw new NotFoundException('No Timeline was found')
    }
    return this.rundownExecutionMongoEntityConverter.convertToTimeline(mongoTimeline)
  }

  public async saveTimeline(timeline: Timeline): Promise<void> {
    this.assertDatabaseConnection(this.saveTimeline.name)
    const mongoTimeline: MongoTimeline = this.rundownExecutionMongoEntityConverter.convertToMongoTimeline(timeline)
    await this.getCollection().replaceOne({ _id: mongoTimeline._id }, mongoTimeline)
  }
}
