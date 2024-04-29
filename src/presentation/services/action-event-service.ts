import { ActionEventEmitter } from '../../business-logic/services/interfaces/action-event-emitter'
import { ActionEventBuilder } from '../interfaces/action-event-builder'
import { ActionEvent, ActionsUpdatedEvent } from '../value-objects/action-event'
import { Action } from '../../model/entities/action'
import { ActionEventObserver } from '../interfaces/action-event-observer'

export class ActionEventService implements ActionEventEmitter, ActionEventObserver {
  private static instance: ActionEventService

  public static getInstance(actionEventBuilder: ActionEventBuilder): ActionEventService {
    if (!this.instance) {
      this.instance = new ActionEventService(actionEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((actionEvent: ActionEvent) => void)[] = []

  private constructor(private readonly actionEventBuilder: ActionEventBuilder) {
  }

  private emitActionEvents(actionEvent: ActionEvent): void {
    this.callbacks.forEach(callback => callback(actionEvent))
  }

  public emitActionsUpdatedEvent(actions: Action[], rundownId?: string): void {
    const event: ActionsUpdatedEvent = this.actionEventBuilder.buildActionsUpdatedEvent(actions, rundownId)
    this.emitActionEvents(event)
  }

  public subscribeToActionEvents(onActionEventCallback: (actionEvent: ActionEvent) => void): void {
    this.callbacks.push(onActionEventCallback)
  }
}
