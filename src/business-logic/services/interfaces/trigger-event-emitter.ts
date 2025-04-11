import { Trigger } from '../../../model/entities/trigger'

export interface TriggerEventEmitter {
  emitTriggerCreatedEvent(trigger: Trigger): void
  emitTriggerUpdatedEvent(trigger: Trigger): void
  emitTriggerDeletedEvent(triggerId: string): void
}
