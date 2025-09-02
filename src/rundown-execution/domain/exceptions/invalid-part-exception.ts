import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class InvalidPartException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.INVALID_PART, message)
  }
}
