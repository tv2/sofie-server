import { StatusMessage } from '../../rundown-execution/domain/entities/status-message'
import { StatusMessageEvent } from '../value-objects/status-message-event'

export interface StatusMessageEventBuilder {
  buildStatusMessageEvent(statusMessage: StatusMessage): StatusMessageEvent
}
