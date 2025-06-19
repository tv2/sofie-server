import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class FirstSegmentInRundownException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.FIRST_SEGMENT_IN_RUNDOWN, message)
  }
}
