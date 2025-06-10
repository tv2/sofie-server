import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class ConflictException extends Exception {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message)
  }
}
