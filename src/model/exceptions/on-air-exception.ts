import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class OnAirException extends Exception {
  constructor(message: string) {
    super(ErrorCode.ON_AIR, message)
  }
}
