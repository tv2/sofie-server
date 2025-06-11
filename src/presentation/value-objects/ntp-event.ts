import { TypedEvent } from '../../cross-cutting-concerns/application/value-objects/typed-event'
import { NtpEventType } from '../enums/event-type'

export interface NtpEvent extends TypedEvent {
  type: NtpEventType
  clientTimestamp: number
}
