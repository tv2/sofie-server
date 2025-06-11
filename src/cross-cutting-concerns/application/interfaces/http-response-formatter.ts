import { ErrorCode } from '../../../rundown-execution/domain/enums/error-code'
import { Exception } from '../../../rundown-execution/domain/exceptions/exception'

export interface HttpResponseFormatter {
  formatSuccessResponse(data?: unknown): object
  formatFailResponse(data?: unknown): object
  formatErrorResponse(message: string, errorCode: ErrorCode): object
  formatErrorResponseFromException(exception: Exception): object
}