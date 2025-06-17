import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class DuplicateIdException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.DUPLICATE_ID, message)
  }
}
