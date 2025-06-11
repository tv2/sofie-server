import { Tv2ErrorCode } from '../enums/tv2-error-code'

export class Tv2Exception extends Error {
  public readonly errorCode: Tv2ErrorCode

  constructor(errorCode: Tv2ErrorCode, message: string) {
    super(message)
    this.errorCode = errorCode
  }
}
