import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class LockRundownException extends Exception {
  constructor(message: string) {
    super(ErrorCode.RUNDOWN_IS_LOCKED, message)
  }
}
