import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class ThrottledRundownException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.RUNDOWN_IS_THROTTLED, message)
  }
}
