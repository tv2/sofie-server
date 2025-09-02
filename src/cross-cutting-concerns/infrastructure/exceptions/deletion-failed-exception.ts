import { ErrorCode } from '../../domain/enums/error-code'
import { Exception } from '../../domain/exceptions/exception'

export class DeletionFailedException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.DELETION_FAILED, message)
  }
}
