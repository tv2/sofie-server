import { ErrorCode } from '../../model/enums/error-code'

export interface HttpResponseFormatter {
  formatSuccessResponse(data?: object): object
  formatFailResponse(data?: object): object
  formatErrorResponse(message: string, errorCode: ErrorCode): object
}