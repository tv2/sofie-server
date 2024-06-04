import { BaseMongoRepository } from './base-mongo-repository'
import { ActionRepository } from '../interfaces/action-repository'
import { Action } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { DeleteResult } from 'mongodb'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const COLLECTION_NAME: string = 'actions'

export class MongoActionRepository extends BaseMongoRepository implements ActionRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getAction(actionId: string): Promise<Action> {
    this.assertDatabaseConnection(this.getAction.name)
    const action: Action | null = await this.getCollection().findOne<Action>({ id: actionId })
    if (action === null) {
      throw new NotFoundException(`No Action found for ActionId ${actionId}`)
    }
    return action
  }

  public async getActions(): Promise<Action[]> {
    this.assertDatabaseConnection(this.getActions.name)
    return this.getCollection().find<Action>({ rundownId: { $exists: false } }).toArray()
  }

  public async getActionsForRundown(rundownId:string): Promise<Action[]> {
    this.assertDatabaseConnection(this.getActionsForRundown.name)
    const systemActions: Action[] = await this.getActions()
    const rundownActions: Action[] = await this.getCollection().find<Action>({ rundownId: rundownId }).toArray()
    return systemActions.concat(rundownActions)
  }

  public async saveActions(actions: Action[]): Promise<void> {
    this.assertDatabaseConnection(this.saveActions.name)
    await Promise.all(
      actions.map(action =>
        this.getCollection().updateOne({ _id: action.id }, { $set: action }, { upsert: true, ignoreUndefined: true })
      )
    )
  }

  public async deleteActionsNotOnRundowns(): Promise<void> {
    await this.getCollection().deleteMany({ rundownId: null })
  }

  public async deleteActionsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteActionsForRundown.name)
    const actionsDeleteResult: DeleteResult = await this.getCollection().deleteMany({ rundownId: rundownId })

    if (!actionsDeleteResult.acknowledged) {
      throw new DeletionFailedException(`Failed to delete Actions for Rundown: ${rundownId}`)
    }
  }
}
