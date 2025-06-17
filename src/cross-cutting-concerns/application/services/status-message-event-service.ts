import { StatusMessageEventObserver } from '../interfaces/status-message-event-observer'
import { StatusMessageEventEmitter } from '../interfaces/status-message-event-emitter'
import { StatusMessage } from '../../domain/entities/status-message'
import { StatusMessageEvent } from '../value-objects/status-message-event'
import { StatusMessageEventBuilder } from '../interfaces/status-message-event-builder'

export class StatusMessageEventService implements StatusMessageEventEmitter, StatusMessageEventObserver {
  private readonly callbacks: ((statusMessageEvent: StatusMessageEvent) => void)[] = []

  constructor(private readonly statusMessageEventBuilder: StatusMessageEventBuilder) {
  }

  public emitStatusMessageEvent(statusMessage: StatusMessage): void {
    const event: StatusMessageEvent = this.statusMessageEventBuilder.buildStatusMessageEvent(statusMessage)
    this.callbacks.forEach(callback => callback(event))
  }

  public subscribeToStatusMessageEvents(onStatusEventCallback: (statusMessageEvent: StatusMessageEvent) => void): void {
    this.callbacks.push(onStatusEventCallback)
  }
}
