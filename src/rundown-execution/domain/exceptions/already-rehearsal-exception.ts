import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class AlreadyRehearsalException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.ALREADY_REHEARSAL, message)
  }
}
