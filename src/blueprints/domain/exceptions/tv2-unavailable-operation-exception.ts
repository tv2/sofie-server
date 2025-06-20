import { Tv2Exception } from './tv2-exception'
import { Tv2ErrorCode } from '../enums/tv2-error-code'

export class Tv2UnavailableOperationException extends Tv2Exception {
  public constructor(message: string) {
    super(Tv2ErrorCode.UNAVAILABLE_OPERATION, message)
  }
}
