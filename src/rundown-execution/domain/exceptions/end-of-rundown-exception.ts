import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class EndOfRundownException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.END_OF_RUNDOWN, message)
  }
}
