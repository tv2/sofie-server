import { TypedEvent } from './typed-event'
import { ActionTriggerEventType } from '../enums/rundown-event-type'
import { ActionTriggerDto } from '../dtos/action-trigger-dto'

export type ActionTriggerEvent = ActionTriggerCreatedEvent | ActionTriggerUpdatedEvent | ActionTriggerDeletedEvent

export interface ActionTriggerCreatedEvent extends TypedEvent {
  type: ActionTriggerEventType.ACTION_TRIGGER_CREATED
  actionTrigger: ActionTriggerDto
}

export interface ActionTriggerUpdatedEvent extends TypedEvent {
  type: ActionTriggerEventType.ACTION_TRIGGER_UPDATED
  actionTrigger: ActionTriggerDto
}

export interface ActionTriggerDeletedEvent extends TypedEvent {
  type: ActionTriggerEventType.ACTION_TRIGGER_DELETED
  actionTriggerId: string
}
