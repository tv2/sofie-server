import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class BadRequestException extends Exception {
  constructor(message: string) {
    super(ErrorCode.BAD_REQUEST, message)
  }
}
