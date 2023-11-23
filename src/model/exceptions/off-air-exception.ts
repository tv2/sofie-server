import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class OffAirException extends Exception {
  constructor(message: string) {
    super(ErrorCode.OFF_AIR, message)
  }
}
