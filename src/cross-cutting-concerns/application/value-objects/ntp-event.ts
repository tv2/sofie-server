import { TypedEvent } from './typed-event'
import { NtpEventType } from '../../../leftovers/event-type'

export interface NtpEvent extends TypedEvent {
  type: NtpEventType
  clientTimestamp: number
}
