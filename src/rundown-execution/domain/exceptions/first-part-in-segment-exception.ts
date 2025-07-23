import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'
import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'

export class FirstPartInSegmentException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.FIRST_PART_IN_SEGMENT, message)
  }
}
