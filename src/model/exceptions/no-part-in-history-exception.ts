import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class NoPartInHistoryException extends Exception {
  constructor(message: string) {
    super(ErrorCode.NO_PART_IN_HISTORY, message)
  }
}
