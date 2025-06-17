import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { RundownBaselineRepository } from '../../../domain/repositories/rundown-baseline-repository'
import { TimelineObject } from '../../../domain/entities/timeline-object'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { NotFoundException } from '../../../domain/exceptions/not-found-exception'
import { MongoTimeline } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'rundownBaselineObjs'

interface TimelineObjectsString {
  timelineObjectsString: string
}

export class MongoRundownBaselineRepository extends BaseMongoRepository<MongoTimeline> implements RundownBaselineRepository {
  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getRundownBaseline(rundownId: string): Promise<TimelineObject[]> {
    this.assertDatabaseConnection(this.getRundownBaseline.name)
    const rundownBaseline: TimelineObjectsString | null = await this.getCollection().findOne<TimelineObjectsString>({
      rundownId,
    })
    if (!rundownBaseline) {
      throw new NotFoundException(`No baseline found for Rundown with id: ${rundownId}`)
    }
    const timelineObjects: TimelineObject[] = JSON.parse(rundownBaseline.timelineObjectsString)
    return timelineObjects ?? []
  }
}
