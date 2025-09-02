import { ErrorCode } from '../../../cross-cutting-concerns/domain/enums/error-code'
import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'

export class OnAirException extends Exception {
  public constructor(message: string) {
    super(ErrorCode.ON_AIR, message)
  }
}
