import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class LastSegmentInRundownException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.LAST_SEGMENT_IN_RUNDOWN, message)
  }
}
