import { TriggerEventEmitter } from '../../business-logic/services/interfaces/trigger-event-emitter'
import { TriggerEventObserver } from '../interfaces/trigger-event-observer'
import { Trigger } from '../../rundown-execution/domain/entities/trigger'
import {
  TriggerCreatedEvent, TriggerDeletedEvent,
  TriggerEvent,
  TriggerUpdatedEvent
} from '../value-objects/trigger-event'
import { TriggerEventBuilder } from '../interfaces/trigger-event-builder'

export class TriggerEventService implements TriggerEventEmitter, TriggerEventObserver {
  private static instance: TriggerEventService

  public static getInstance(triggerEventBuilder: TriggerEventBuilder): TriggerEventService {
    if (!this.instance) {
      this.instance = new TriggerEventService(triggerEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((triggerEvent: TriggerEvent) => void)[] = []

  constructor(private readonly triggerEventBuilder: TriggerEventBuilder) { }

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
