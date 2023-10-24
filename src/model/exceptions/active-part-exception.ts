import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class ActivePartException extends Exception {
  constructor(message: string) {
    super(ErrorCode.PART_IS_ACTIVE, message)
  }
}
