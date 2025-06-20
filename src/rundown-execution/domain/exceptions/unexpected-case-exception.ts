import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class UnexpectedCaseException extends Exception {
  public constructor(unexpectedCase: string, scenario: string) {
    super(ErrorCode.UNEXPECTED_CASE, `Encountered the unexpected case '${unexpectedCase}' for ${scenario}.`)
  }
}
