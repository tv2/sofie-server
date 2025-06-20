import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class TakeIsBlockedException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.TAKE_IS_BLOCKED, message)
  }
}
