import { ErrorCode } from '../../model/enums/error-code'

export interface HttpResponseFormatter {
  buildSuccessResponse(data: object): object
  buildFailResponse(data: object): object
  buildErrorResponse(message: string, errorCode: ErrorCode): object
}