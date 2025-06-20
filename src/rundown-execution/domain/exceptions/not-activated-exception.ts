import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class NotActivatedException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.NOT_ACTIVATED, message)
  }
}
