import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class ConflictException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.CONFLICT, message)
  }
}
