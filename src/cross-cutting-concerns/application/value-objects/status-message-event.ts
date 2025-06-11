import { TypedEvent } from './typed-event'
import { StatusMessage } from '../../domain/entities/status-message'
import { StatusMessageEventType } from '../../../presentation/enums/event-type'

export interface StatusMessageEvent extends TypedEvent {
  type: StatusMessageEventType.STATUS_MESSAGE
  statusMessage: StatusMessage
}
