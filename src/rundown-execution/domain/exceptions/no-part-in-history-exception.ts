import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class NoPartInHistoryException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.NO_PART_IN_HISTORY, message)
  }
}
