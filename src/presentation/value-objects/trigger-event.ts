import { TypedEvent } from './typed-event'
import { TriggerEventType } from '../enums/event-type'
import { TriggerDto } from '../../rundown-execution/application/dtos/trigger-dto'

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
