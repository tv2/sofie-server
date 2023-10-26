import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class AlreadyExistException extends Exception {
  constructor(message: string) {
    super(ErrorCode.ALREADY_EXIST, message)
  }
}
