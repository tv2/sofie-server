import { TypedEvent } from './typed-event'
import { NtpEventType } from '../../../presentation/event-type'

export interface NtpEvent extends TypedEvent {
  type: NtpEventType
  clientTimestamp: number
}
