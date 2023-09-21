import { BaseMongoRepository } from './base-mongo-repository'
import { RundownBaselineRepository } from '../interfaces/rundown-baseline-repository'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter } from './mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const COLLECTION_NAME: string = 'rundownBaselineObjs'

interface TimelineObjectsString {
  timelineObjectsString: string
}

export class MongoRundownBaselineRepository extends BaseMongoRepository implements RundownBaselineRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  // TODO: Test this when receiving the setup for in-memory-mongo-database for test
  public async getRundownBaseline(rundownId: string): Promise<TimelineObject[]> {
    this.assertDatabaseConnection(this.getRundownBaseline.name)
    const rundownBaseline: TimelineObjectsString | null = (await this.getCollection().findOne<TimelineObjectsString>({
      rundownId,
    }))
    if (!rundownBaseline) {
      throw new NotFoundException(`No baseline found for Rundown with id: ${rundownId}`)
    }
    const timelineObjects: TimelineObject[] = JSON.parse(rundownBaseline.timelineObjectsString)
    return timelineObjects ?? []
  }
}
