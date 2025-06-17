import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { TriggerDto } from '../dtos/trigger-dto'
import {TriggerEventType} from '../enums/trigger-event-type'

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
