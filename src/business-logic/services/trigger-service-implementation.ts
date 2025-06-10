import { TriggerService } from './interfaces/trigger-service'
import { Trigger } from '../../rundown-execution/domain/entities/trigger'
import { TriggerRepository } from '../../data-access/repositories/interfaces/trigger-repository'
import { TriggerEventEmitter } from './interfaces/trigger-event-emitter'

export class TriggerServiceImplementation implements TriggerService {

  constructor(
    private readonly triggerEventEmitter: TriggerEventEmitter,
    private readonly triggerRepository: TriggerRepository
  ) { }

  public async getTriggers(): Promise<Trigger[]> {
    return this.triggerRepository.getTriggers()
  }

  public async createTrigger(trigger: Trigger): Promise<void> {
    const createdTrigger: Trigger = await this.triggerRepository.createTrigger(trigger)
    this.triggerEventEmitter.emitTriggerCreatedEvent(createdTrigger)
  }

  public async updateTrigger(trigger: Trigger): Promise<void> {
    const updatedTrigger: Trigger = await this.triggerRepository.updateTrigger(trigger)
    this.triggerEventEmitter.emitTriggerUpdatedEvent(updatedTrigger)
  }

  public async deleteTrigger(triggerId: string): Promise<void> {
    await this.triggerRepository.deleteTrigger(triggerId)
    this.triggerEventEmitter.emitTriggerDeletedEvent(triggerId)
  }
}
