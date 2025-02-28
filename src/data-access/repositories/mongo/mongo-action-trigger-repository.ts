import { BaseMongoRepository } from './base-mongo-repository'
import { TriggerRepository } from '../interfaces/trigger-repository'
import { ActionTrigger, Trigger} from '../../../model/entities/trigger'
import { MongoDatabase } from './mongo-database'
import { UuidGenerator } from '../interfaces/uuid-generator'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { MongoId } from './mongo-entity-converter'

const ACTION_TRIGGER_COLLECTION: string = 'actionTriggers'

export class MongoActionTriggerRepository extends BaseMongoRepository<ActionTrigger & MongoId> implements TriggerRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return ACTION_TRIGGER_COLLECTION
  }

  public async getTriggers(): Promise<ActionTrigger[]> {
    this.assertDatabaseConnection(this.getTriggers.name)
    return this.getCollection().find<ActionTrigger>({}).toArray()
  }

  public async createTrigger(actionTriggerWithoutId: Omit<ActionTrigger, 'id'>): Promise<Trigger> {
    this.assertDatabaseConnection(this.createTrigger.name)
    const actionTrigger: ActionTrigger = {
      ...actionTriggerWithoutId,
      id: this.uuidGenerator.generateUuid()
    }
    await this.getCollection().insertOne({ ...actionTrigger, _id: actionTrigger.id })
    return actionTrigger
  }

  public async updateTrigger(actionTrigger: ActionTrigger): Promise<Trigger> {
    this.assertDatabaseConnection(this.updateTrigger.name)
    if (!await this.doesActionTriggerExist(actionTrigger.id)) {
      throw new NotFoundException(`Can't update ActionTrigger ${actionTrigger.id}. It does not exist in the database`)
    }
    await this.getCollection().updateOne({ id: actionTrigger.id }, { $set: actionTrigger })
    return actionTrigger
  }

  private async doesActionTriggerExist(actionTriggerId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: actionTriggerId })) === 1
  }

  public async deleteTrigger(actionTriggerId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteTrigger.name)
    await this.getCollection().deleteOne({ _id: actionTriggerId })
  }
}
