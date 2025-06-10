import { HttpResponseFormatter } from './interfaces/http-response-formatter'
import { ErrorCode } from '../rundown-execution/domain/enums/error-code'
import { Exception } from '../rundown-execution/domain/exceptions/exception'

enum RequestStatus {
  ERROR = 'ERROR',
  FAIL = 'FAIL',
  SUCCESS = 'SUCCESS'
}

export class JsendResponseFormatter implements HttpResponseFormatter {
  public formatErrorResponse(message: string, errorCode: ErrorCode): object {
    return {
      status: RequestStatus.ERROR,
      code: errorCode,
      message: message,
    }
  }

  public formatErrorResponseFromException(exception: Exception): object {
    return this.formatErrorResponse(exception.message, exception.errorCode)
  }

  public formatFailResponse(data?: unknown): object {
    return {
      status: RequestStatus.FAIL,
      data: data ?? null
    }
  }

  public formatSuccessResponse(data?: unknown): object {
    return {
      status: RequestStatus.SUCCESS,
      data: data ?? null
    }
  }
}