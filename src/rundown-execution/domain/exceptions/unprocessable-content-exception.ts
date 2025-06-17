import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class UnprocessableContentException extends Exception {
  constructor(message: string) {
    super(ErrorCode.UNPROCESSABLE_ENTITY, message)
  }
}
