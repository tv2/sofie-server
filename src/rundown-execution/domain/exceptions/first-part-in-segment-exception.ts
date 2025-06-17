import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class FirstPartInSegmentException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.FIRST_PART_IN_SEGMENT, message)
  }
}
