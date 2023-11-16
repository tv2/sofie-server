import { BaseMongoRepository } from './base-mongo-repository'
import { ActionRepository } from '../interfaces/action-repository'
import { Action } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter } from './mongo-entity-converter'
import { DeleteResult } from 'mongodb'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'

const COLLECTION_NAME: string = 'actions'

export class MongoActionRepository extends BaseMongoRepository implements ActionRepository {

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getAction(actionId: string): Promise<Action> {
    this.assertDatabaseConnection(this.getAction.name)
    return await this.getCollection().findOne({id: actionId}) as unknown as Action
  }

  public async saveActions(actions: Action[]): Promise<void> {
    this.assertDatabaseConnection(this.saveActions.name)
    await Promise.all(
      actions.map(action =>
        this.getCollection().updateOne({ _id: action.id }, { $set: action }, { upsert: true, ignoreUndefined: true })
      )
    )
  }

  public async deleteActionsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteActionsForRundown.name)
    const actionsDeleteResult: DeleteResult = await this.getCollection().deleteMany({ rundownId: rundownId })

    if (!actionsDeleteResult.acknowledged) {
      throw new DeletionFailedException(`Failed to delete Actions for Rundown: ${rundownId}`)
    }
  }
}
