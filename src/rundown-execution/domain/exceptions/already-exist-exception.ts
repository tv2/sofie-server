import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class AlreadyExistException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.ALREADY_EXIST, message)
  }
}
