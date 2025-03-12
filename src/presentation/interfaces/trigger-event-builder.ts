import { Trigger } from '../../model/entities/trigger'
import {
  TriggerCreatedEvent,
  TriggerDeletedEvent,
  TriggerUpdatedEvent
} from '../value-objects/trigger-event'

export interface TriggerEventBuilder {
  buildTriggerCreatedEvent(trigger: Trigger): TriggerCreatedEvent
  buildTriggerUpdatedEvent(trigger: Trigger): TriggerUpdatedEvent
  buildTriggerDeletedEvent(triggerId: string): TriggerDeletedEvent
}
