import { TriggerEventEmitter } from '../interfaces/trigger-event-emitter'
import { Trigger } from '../../domain/entities/trigger'
import {
  TriggerCreatedEvent, TriggerDeletedEvent,
  TriggerEvent,
  TriggerUpdatedEvent
} from '../value-objects/trigger-event'
import { TriggerEventBuilder } from '../interfaces/trigger-event-builder'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class TriggerEventService implements TriggerEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly triggerEventBuilder: TriggerEventBuilder) { }

  private emitTriggerEvent(triggerEvent: TriggerEvent): void {
    this.typedEventEmitter.emitTypedEvent(triggerEvent)
  }

  public emitTriggerCreatedEvent(trigger: Trigger): void {
    const event: TriggerCreatedEvent = this.triggerEventBuilder.buildTriggerCreatedEvent(trigger)
    this.emitTriggerEvent(event)
  }

  public emitTriggerUpdatedEvent(trigger: Trigger): void {
    const event: TriggerUpdatedEvent = this.triggerEventBuilder.buildTriggerUpdatedEvent(trigger)
    this.emitTriggerEvent(event)
  }

  public emitTriggerDeletedEvent(triggerId: string): void {
    const event: TriggerDeletedEvent = this.triggerEventBuilder.buildTriggerDeletedEvent(triggerId)
    this.emitTriggerEvent(event)
  }
}
