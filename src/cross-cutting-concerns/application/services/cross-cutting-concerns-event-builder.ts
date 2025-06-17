import { StatusMessageEventBuilder } from '../interfaces/status-message-event-builder'
import { StatusMessage } from '../../domain/entities/status-message'
import { StatusMessageEvent } from '../value-objects/status-message-event'
import { StatusMessageEventType } from '../enums/status-message-event-type'

export class CrossCuttingConcernsEventBuilder implements StatusMessageEventBuilder {
  public buildStatusMessageEvent(statusMessage: StatusMessage): StatusMessageEvent {
    return {
      type: StatusMessageEventType.STATUS_MESSAGE,
      timestamp: Date.now(),
      statusMessage
    }
  }
}
