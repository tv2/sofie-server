import { BaseMongoRepository } from './base-mongo-repository'
import { ActionTriggerRepository } from '../interfaces/action-trigger-repository'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter } from './mongo-entity-converter'
import { ActionTrigger } from '../../../model/value-objects/action-trigger'

const COLLECTION_NAME: string = 'actionTriggers'

export class MongoActionTriggerRepository extends BaseMongoRepository implements ActionTriggerRepository {

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getActionTriggers(): Promise<ActionTrigger[]> {
    return await this.getCollection().find().toArray() as unknown as ActionTrigger[]
  }

  public async saveActionTrigger(actionTrigger: ActionTrigger): Promise<void> {
    await this.getCollection().updateOne({ id: actionTrigger.id }, { $set: actionTrigger }, { upsert: true })
  }
}
