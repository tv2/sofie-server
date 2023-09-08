import { ErrorCode } from '../enums/error-code'

export class Exception extends Error {
  public readonly errorCode: ErrorCode

  constructor(errorCode: ErrorCode, message?: string) {
    super(message)
    this.errorCode = errorCode
  }
}
