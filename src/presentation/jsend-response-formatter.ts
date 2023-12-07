import { HttpResponseFormatter } from './interfaces/http-response-formatter'
import { ErrorCode } from '../model/enums/error-code'
import { Exception } from '../model/exceptions/exception'

enum JSendStatus {
  ERROR = 'ERROR',
  FAIL = 'FAIL',
  SUCCESS = 'SUCCESS'
}

export class JsendResponseFormatter implements HttpResponseFormatter{
  public formatErrorResponse(message: string, errorCode: ErrorCode): object {
    return {
      status: JSendStatus.ERROR,
      code: errorCode,
      message: message,
    }
  }

  public formatErrorResponseFromException(exception: Exception): object {
    return this.formatErrorResponse(exception.message, exception.errorCode)
  }

  public formatFailResponse(data?: unknown): object {
    return {
      status: JSendStatus.FAIL,
      data: data ?? null
    }
  }

  public formatSuccessResponse(data?: unknown): object {
    return {
      status: JSendStatus.SUCCESS,
      data: data ?? null
    }
  }
}