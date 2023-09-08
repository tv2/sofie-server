import { Exception } from './exception'
import { ErrorCode } from '../enums/error-code'

export class UnexpectedCaseException extends Exception {
	constructor(unexpectedCase: string) {
		super(ErrorCode.UNEXPECTED_CASE, `Encountered unexpected case: ${unexpectedCase}`)
	}
}
