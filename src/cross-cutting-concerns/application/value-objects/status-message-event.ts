import { TypedEvent } from './typed-event'
import { StatusMessage } from '../../domain/entities/status-message'

import { StatusMessageEventType } from '../enums/status-message-event-type'

export interface StatusMessageEvent extends TypedEvent {
  type: StatusMessageEventType.STATUS_MESSAGE
  statusMessage: StatusMessage
}
