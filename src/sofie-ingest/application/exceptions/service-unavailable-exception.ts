import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class ServiceUnavailableException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message)
  }
}
