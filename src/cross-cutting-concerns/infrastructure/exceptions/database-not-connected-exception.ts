import { Exception } from '../../domain/exceptions/exception'
import { ErrorCode } from '../../domain/enums/error-code'

export class DatabaseNotConnectedException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.DATABASE_NOT_CONNECTED, message)
  }
}
