import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'
import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'

export class ThrottledRundownException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.RUNDOWN_IS_THROTTLED, message)
  }
}
