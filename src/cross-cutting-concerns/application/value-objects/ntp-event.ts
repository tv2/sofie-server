import { TypedEvent } from './typed-event'

import {NtpEventType} from '../enums/ntp-event-type'

export interface NtpEvent extends TypedEvent {
  type: NtpEventType
  clientTimestamp: number
}
