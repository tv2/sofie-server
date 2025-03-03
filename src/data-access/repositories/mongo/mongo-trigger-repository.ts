import { BaseMongoRepository } from './base-mongo-repository'
import { TriggerRepository } from '../interfaces/trigger-repository'
import { ActionTrigger, MacroTrigger, Trigger, TriggerType } from '../../../model/entities/trigger'
import { MongoDatabase } from './mongo-database'
import { UuidGenerator } from '../interfaces/uuid-generator'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { MongoId } from './mongo-entity-converter'

const ACTION_TRIGGER_COLLECTION: string = 'actionTriggers'

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
    switch (triggerWithoutId.type) {
      case TriggerType.ACTION: {
        return this.createNewActionTrigger(triggerWithoutId)
      }
      case TriggerType.MACRO: {
        return this.createNewMacroTrigger(triggerWithoutId)
      }
    }
  }

  private async createNewActionTrigger(triggerWithoutId:  Omit<Trigger, 'id'>): Promise<ActionTrigger> {
    const actionTrigger: ActionTrigger = {
      ...triggerWithoutId as ActionTrigger,
      id: this.uuidGenerator.generateUuid()
    }
    await this.getCollection().insertOne({...actionTrigger, _id: actionTrigger.id})
    return actionTrigger
  }

  private async createNewMacroTrigger(triggerWithoutId: Omit<Trigger, 'id'>): Promise<MacroTrigger> {
    const macroTrigger: MacroTrigger = {
      ...triggerWithoutId as MacroTrigger,
      id: this.uuidGenerator.generateUuid()
    }
    await this.getCollection().insertOne({...macroTrigger, _id: macroTrigger.id})
    return macroTrigger
  }

  public async updateTrigger(trigger: Trigger): Promise<Trigger> {
    this.assertDatabaseConnection(this.updateTrigger.name)
    if (!await this.doesActionTriggerExist(trigger.id)) {
      throw new NotFoundException(`Can't update Trigger ${trigger.id}. It does not exist in the database`)
    }
    await this.getCollection().updateOne({ id: trigger.id }, { $set: trigger })
    return trigger
  }

  private async doesActionTriggerExist(triggerId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: triggerId })) === 1
  }

  public async deleteTrigger(triggerId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteTrigger.name)
    await this.getCollection().deleteOne({ _id: triggerId })
  }
}
