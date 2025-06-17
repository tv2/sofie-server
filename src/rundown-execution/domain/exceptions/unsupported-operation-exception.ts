import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class UnsupportedOperationException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.UNSUPPORTED_OPERATION, message)
  }
}
