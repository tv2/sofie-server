import { TriggerEventEmitter } from '../interfaces/trigger-event-emitter'
import { TriggerEventObserver } from '../interfaces/trigger-event-observer'
import { Trigger } from '../../domain/entities/trigger'
import {
  TriggerCreatedEvent, TriggerDeletedEvent,
  TriggerEvent,
  TriggerUpdatedEvent
} from '../value-objects/trigger-event'
import { TriggerEventBuilder } from '../interfaces/trigger-event-builder'

export class TriggerEventService implements TriggerEventEmitter, TriggerEventObserver {
  private readonly callbacks: ((triggerEvent: TriggerEvent) => void)[] = []

  public constructor(private readonly triggerEventBuilder: TriggerEventBuilder) { }

  private emitTriggerEvent(triggerEvent: TriggerEvent): void {
    this.callbacks.forEach(callback => callback(triggerEvent))
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

  public subscribeToTriggerEvents(onTriggerEventCallback: (triggerEvent: TriggerEvent) => void): void {
    this.callbacks.push(onTriggerEventCallback)
  }
}
