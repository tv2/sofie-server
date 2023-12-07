import { ActionTrigger } from '../../model/entities/action-trigger'
import {
  ActionTriggerCreatedEvent,
  ActionTriggerDeletedEvent,
  ActionTriggerUpdatedEvent
} from '../value-objects/action-trigger-event'

export interface ActionTriggerEventBuilder {
  buildActionTriggerCreatedEvent(actionTrigger: ActionTrigger): ActionTriggerCreatedEvent
  buildActionTriggerUpdatedEvent(actionTrigger: ActionTrigger): ActionTriggerUpdatedEvent
  buildActionTriggerDeletedEvent(actionTriggerId: string): ActionTriggerDeletedEvent
}
