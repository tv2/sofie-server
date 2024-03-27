import { StatusMessage } from '../../model/entities/status-message'
import { StatusMessageEvent } from '../value-objects/status-message-event'

export interface StatusMessageEventBuilder {
  buildStatusMessageEvent(statusMessage: StatusMessage): StatusMessageEvent
}
