import { BaseMongoRepository } from './base-mongo-repository'
import { TriggerRepository } from '../interfaces/trigger-repository'
import { Trigger } from '../../../rundown-execution/domain/entities/trigger'
import { MongoDatabase } from './mongo-database'
import { UuidGenerator } from '../interfaces/uuid-generator'
import { NotFoundException } from '../../../rundown-execution/domain/exceptions/not-found-exception'
import { MongoId } from './mongo-entity-converter'

const ACTION_TRIGGER_COLLECTION: string = 'triggers'

export class MongoTriggerRepository extends BaseMongoRepository<Trigger & MongoId> implements TriggerRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return ACTION_TRIGGER_COLLECTION
  }

  public async getTriggers(): Promise<Trigger[]> {
    this.assertDatabaseConnection(this.getTriggers.name)
    return this.getCollection().find<Trigger>({}).toArray()
  }

  public async createTrigger(triggerWithoutId: Omit<Trigger, 'id'>): Promise<Trigger> {
    this.assertDatabaseConnection(this.createTrigger.name)
    const trigger: Trigger = {
      ...triggerWithoutId,
      id: this.uuidGenerator.generateUuid()
    } as Trigger

    await this.getCollection().insertOne({...trigger, _id: trigger.id})
    return trigger
  }

  public async updateTrigger(trigger: Trigger): Promise<Trigger> {
    this.assertDatabaseConnection(this.updateTrigger.name)
    if (!await this.doesTriggerExist(trigger.id)) {
      throw new NotFoundException(`Can't update Trigger ${trigger.id}. It does not exist in the database`)
    }
    await this.getCollection().updateOne({ id: trigger.id }, { $set: trigger })
    return trigger
  }

  private async doesTriggerExist(triggerId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: triggerId })) === 1
  }

  public async deleteTrigger(triggerId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteTrigger.name)
    await this.getCollection().deleteOne({ _id: triggerId })
  }
}
