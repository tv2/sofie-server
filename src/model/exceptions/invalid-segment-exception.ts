import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class InvalidSegmentException extends Exception {
  constructor(message: string) {
    super(ErrorCode.INVALID_SEGMENT, message)
  }
}
