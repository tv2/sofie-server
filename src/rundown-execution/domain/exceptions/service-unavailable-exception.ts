import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class ServiceUnavailableException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message)
  }
}
