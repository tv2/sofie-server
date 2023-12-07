import { BaseMongoRepository } from './base-mongo-repository'
import { ActionTriggerRepository } from '../interfaces/action-trigger-repository'
import { ActionTrigger } from '../../../model/entities/action-trigger'
import { MongoDatabase } from './mongo-database'
import { UuidGenerator } from '../interfaces/uuid-generator'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const ACTION_TRIGGER_COLLECTION: string = 'actionTriggers'

export class MongoActionTriggerRepository extends BaseMongoRepository implements ActionTriggerRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return ACTION_TRIGGER_COLLECTION
  }

  public async getActionTriggers(): Promise<ActionTrigger[]> {
    this.assertDatabaseConnection(this.getActionTriggers.name)
    return this.getCollection().find<ActionTrigger>({}).toArray()
  }

  public async createActionTrigger(actionTriggerWithoutId: Omit<ActionTrigger, 'id'>): Promise<ActionTrigger> {
    this.assertDatabaseConnection(this.createActionTrigger.name)
    const actionTrigger: ActionTrigger = {
      ...actionTriggerWithoutId,
      id: this.uuidGenerator.generateUuid()
    }
    await this.getCollection().insertOne({ ...actionTrigger, _id: actionTrigger.id })
    return actionTrigger
  }

  public async updateActionTrigger(actionTrigger: ActionTrigger): Promise<ActionTrigger> {
    this.assertDatabaseConnection(this.updateActionTrigger.name)
    if (!await this.doesActionTriggerExist(actionTrigger.id)) {
      throw new NotFoundException(`Can't update ActionTrigger ${actionTrigger.id}. It does not exist in the database`)
    }
    await this.getCollection().updateOne({ id: actionTrigger.id }, { $set: actionTrigger })
    return actionTrigger
  }

  private async doesActionTriggerExist(actionTriggerId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: actionTriggerId })) === 1
  }

  public async deleteActionTrigger(actionTriggerId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteActionTrigger.name)
    await this.getCollection().deleteOne({ _id: actionTriggerId })
  }
}
