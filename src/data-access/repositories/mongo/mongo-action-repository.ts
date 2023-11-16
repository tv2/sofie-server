import { BaseMongoRepository } from './base-mongo-repository'
import { ActionRepository } from '../interfaces/action-repository'
import { Action } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'actions'

export class MongoActionRepository extends BaseMongoRepository implements ActionRepository {

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getAction(actionId: string): Promise<Action> {
    return await this.getCollection().findOne({id: actionId}) as unknown as Action
  }

  public async saveActions(actions: Action[]): Promise<void> {
    await Promise.all(
      actions.map(action =>
        this.getCollection().updateOne({ _id: action.id }, { $set: action }, { upsert: true, ignoreUndefined: true })
      )
    )
  }
}
