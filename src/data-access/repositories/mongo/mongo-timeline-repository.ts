import { TimelineRepository } from '../interfaces/timeline-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { Timeline } from '../../../model/entities/timeline'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoTimeline } from './mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const TIMELINE_COLLECTION_NAME: string = 'timeline'

export class MongoTimelineRepository extends BaseMongoRepository implements TimelineRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return TIMELINE_COLLECTION_NAME
  }

  public async getTimeline(): Promise<Timeline> {
    const mongoTimeline: MongoTimeline | null = (await this.getCollection().findOne<MongoTimeline>())
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
