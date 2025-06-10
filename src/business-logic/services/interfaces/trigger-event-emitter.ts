import { Trigger } from '../../../rundown-execution/domain/entities/trigger'

export interface TriggerEventEmitter {
  emitTriggerCreatedEvent(trigger: Trigger): void
  emitTriggerUpdatedEvent(trigger: Trigger): void
  emitTriggerDeletedEvent(triggerId: string): void
}
