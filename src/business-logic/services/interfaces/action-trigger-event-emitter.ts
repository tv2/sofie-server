import { ActionTrigger } from '../../../model/entities/action-trigger'

export interface ActionTriggerEventEmitter {
  emitActionTriggerCreatedEvent(actionTrigger: ActionTrigger): void
  emitActionTriggerUpdatedEvent(actionTrigger: ActionTrigger): void
  emitActionTriggerDeletedEvent(actionTriggerId: string): void
}
