import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class InvalidIdException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.INVALID_ID, message)
  }
}
