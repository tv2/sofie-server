import { Tv2Exception } from './tv2-exception'
import { Tv2ErrorCode } from '../enums/tv2-error-code'

export class Tv2MisconfigurationException extends Tv2Exception {
  constructor(message: string) {
    super(Tv2ErrorCode.MISCONFIGURATION, message)
  }
}
