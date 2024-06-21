import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class InvalidPartException extends Exception {
  constructor(message: string) {
    super(ErrorCode.INVALID_PART, message)
  }
}
