import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class NotActivatedException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.NOT_ACTIVATED, message)
  }
}
