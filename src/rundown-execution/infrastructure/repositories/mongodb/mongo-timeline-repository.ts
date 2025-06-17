import { TimelineRepository } from '../../../domain/repositories/timeline-repository'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { Timeline } from '../../../domain/entities/timeline'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { NotFoundException } from '../../../domain/exceptions/not-found-exception'
import { MongoEntityConverter, MongoTimeline } from './mongo-entity-converter'

const TIMELINE_COLLECTION_NAME: string = 'timeline'

export class MongoTimelineRepository extends BaseMongoRepository<MongoTimeline> implements TimelineRepository {
  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
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
    return this.mongoEntityConverter.convertToTimeline(mongoTimeline)
  }

  public async saveTimeline(timeline: Timeline): Promise<void> {
    this.assertDatabaseConnection(this.saveTimeline.name)
    const mongoTimeline: MongoTimeline = this.mongoEntityConverter.convertToMongoTimeline(timeline)
    await this.getCollection().replaceOne({ _id: mongoTimeline._id }, mongoTimeline)
  }
}
