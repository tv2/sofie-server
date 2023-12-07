import { ErrorCode } from '../../model/enums/error-code'
import { Exception } from '../../model/exceptions/exception'

export interface HttpResponseFormatter {
  formatSuccessResponse(data?: unknown): object
  formatFailResponse(data?: unknown): object
  formatErrorResponse(message: string, errorCode: ErrorCode): object
  formatErrorResponseFromException(exception: Exception): object
}