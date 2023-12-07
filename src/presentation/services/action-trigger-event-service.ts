import { ActionTriggerEventEmitter } from '../../business-logic/services/interfaces/action-trigger-event-emitter'
import { ActionTriggerEventObserver } from '../interfaces/action-trigger-event-observer'
import { ActionTrigger } from '../../model/entities/action-trigger'
import {
  ActionTriggerCreatedEvent, ActionTriggerDeletedEvent,
  ActionTriggerEvent,
  ActionTriggerUpdatedEvent
} from '../value-objects/action-trigger-event'
import { ActionTriggerEventBuilder } from '../interfaces/action-trigger-event-builder'

export class ActionTriggerEventService implements ActionTriggerEventEmitter, ActionTriggerEventObserver {
  private static instance: ActionTriggerEventService

  public static getInstance(actionTriggerEventBuilder: ActionTriggerEventBuilder): ActionTriggerEventService {
    if (!this.instance) {
      this.instance = new ActionTriggerEventService(actionTriggerEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((actionTriggerEvent: ActionTriggerEvent) => void)[] = []

  constructor(private readonly actionTriggerEventBuilder: ActionTriggerEventBuilder) { }

  private emitActionTriggerEvent(actionTriggerEvent: ActionTriggerEvent): void {
    this.callbacks.forEach(callback => callback(actionTriggerEvent))
  }

  public emitActionTriggerCreatedEvent(actionTrigger: ActionTrigger): void {
    const event: ActionTriggerCreatedEvent = this.actionTriggerEventBuilder.buildActionTriggerCreatedEvent(actionTrigger)
    this.emitActionTriggerEvent(event)
  }

  public emitActionTriggerUpdatedEvent(actionTrigger: ActionTrigger): void {
    const event: ActionTriggerUpdatedEvent = this.actionTriggerEventBuilder.buildActionTriggerUpdatedEvent(actionTrigger)
    this.emitActionTriggerEvent(event)
  }

  public emitActionTriggerDeletedEvent(actionTriggerId: string): void {
    const event: ActionTriggerDeletedEvent = this.actionTriggerEventBuilder.buildActionTriggerDeletedEvent(actionTriggerId)
    this.emitActionTriggerEvent(event)
  }

  public subscribeToActionTriggerEvents(onActionTriggerEventCallback: (actionTriggerEvent: ActionTriggerEvent) => void): void {
    this.callbacks.push(onActionTriggerEventCallback)
  }
}
