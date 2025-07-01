import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class FirstSegmentInRundownException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.FIRST_SEGMENT_IN_RUNDOWN, message)
  }
}
