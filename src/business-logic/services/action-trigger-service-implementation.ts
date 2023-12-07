import { ActionTriggerService } from './interfaces/action-trigger-service'
import { ActionTrigger } from '../../model/entities/action-trigger'
import { ActionTriggerRepository } from '../../data-access/repositories/interfaces/action-trigger-repository'
import { ActionTriggerEventEmitter } from './interfaces/action-trigger-event-emitter'

export class ActionTriggerServiceImplementation implements ActionTriggerService {

  constructor(
    private readonly actionTriggerEventEmitter: ActionTriggerEventEmitter,
    private readonly actionTriggerRepository: ActionTriggerRepository
  ) { }

  public async getActionTriggers(): Promise<ActionTrigger[]> {
    return this.actionTriggerRepository.getActionTriggers()
  }

  public async createActionTrigger(actionTrigger: ActionTrigger): Promise<void> {
    const createdActionTrigger: ActionTrigger = await this.actionTriggerRepository.createActionTrigger(actionTrigger)
    this.actionTriggerEventEmitter.emitActionTriggerCreatedEvent(createdActionTrigger)
  }

  public async updateActionTrigger(actionTrigger: ActionTrigger): Promise<void> {
    const updatedActionTrigger: ActionTrigger = await this.actionTriggerRepository.updateActionTrigger(actionTrigger)
    this.actionTriggerEventEmitter.emitActionTriggerUpdatedEvent(updatedActionTrigger)
  }

  public async deleteActionTrigger(actionTriggerId: string): Promise<void> {
    await this.actionTriggerRepository.deleteActionTrigger(actionTriggerId)
    this.actionTriggerEventEmitter.emitActionTriggerDeletedEvent(actionTriggerId)
  }
}
