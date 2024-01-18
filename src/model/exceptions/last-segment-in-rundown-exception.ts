import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class LastSegmentInRundownException extends Exception {
  constructor(message: string) {
    super(ErrorCode.LAST_SEGMENT_IN_RUNDOWN, message)
  }
}
