import { TypedEvent } from './typed-event'
import { StatusMessage } from '../../model/entities/status-message'
import { StatusMessageEventType } from '../enums/event-type'

export interface StatusMessageEvent extends TypedEvent {
  type: StatusMessageEventType.STATUS_MESSAGE
  statusMessage: StatusMessage
}
