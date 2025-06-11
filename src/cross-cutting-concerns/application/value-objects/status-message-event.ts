import { TypedEvent } from './typed-event'
import { StatusMessage } from '../../domain/entities/status-message'
import { StatusMessageEventType } from '../../../leftovers/event-type'

export interface StatusMessageEvent extends TypedEvent {
  type: StatusMessageEventType.STATUS_MESSAGE
  statusMessage: StatusMessage
}
