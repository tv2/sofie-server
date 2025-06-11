import { TypedEvent } from '../../../presentation/value-objects/typed-event'
import { TriggerEventType } from '../../../presentation/enums/event-type'
import { TriggerDto } from '../../application/dtos/trigger-dto'

export type TriggerEvent = TriggerCreatedEvent | TriggerUpdatedEvent | TriggerDeletedEvent

export interface TriggerCreatedEvent extends TypedEvent {
  type: TriggerEventType.TRIGGER_CREATED
  trigger: TriggerDto
}

export interface TriggerUpdatedEvent extends TypedEvent {
  type: TriggerEventType.TRIGGER_UPDATED
  trigger: TriggerDto
}

export interface TriggerDeletedEvent extends TypedEvent {
  type: TriggerEventType.TRIGGER_DELETED
  triggerId: string
}
