import { ErrorCode } from '../../model/enums/error-code'
import { Exception } from '../../model/exceptions/exception'

export interface HttpResponseFormatter {
  formatSuccessResponse(data?: object): object
  formatFailResponse(data?: object): object
  formatErrorResponse(message: string, errorCode: ErrorCode): object
  formatErrorResponseFromException(exception: Exception): object
}