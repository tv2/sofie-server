import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class EndOfRundownException extends Exception {
  constructor(message: string) {
    super(ErrorCode.END_OF_RUNDOWN, message)
  }
}
