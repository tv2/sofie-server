import { StatusMessageEventEmitter } from '../interfaces/status-message-event-emitter'
import { StatusMessage } from '../../domain/entities/status-message'
import { StatusMessageEvent } from '../value-objects/status-message-event'
import { StatusMessageEventBuilder } from '../interfaces/status-message-event-builder'
import { TypedEventEmitter } from '../interfaces/typed-event-emitter'

export class StatusMessageEventService implements StatusMessageEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly statusMessageEventBuilder: StatusMessageEventBuilder) {
  }

  public emitStatusMessageEvent(statusMessage: StatusMessage): void {
    const event: StatusMessageEvent = this.statusMessageEventBuilder.buildStatusMessageEvent(statusMessage)
    this.typedEventEmitter.emitTypedEvent(event)
  }
}
