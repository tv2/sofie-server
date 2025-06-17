import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class TakeIsBlockedException extends Exception {
  constructor(message: string) {
    super(ErrorCode.TAKE_IS_BLOCKED, message)
  }
}
