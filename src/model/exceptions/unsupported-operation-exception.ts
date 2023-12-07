import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class UnsupportedOperationException extends Exception {
  constructor(message: string) {
    super(ErrorCode.UNSUPPORTED_OPERATION, message)
  }
}
