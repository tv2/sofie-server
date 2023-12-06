import { HttpResponseFormatter } from './interfaces/http-response-formatter'
import { ErrorCode } from '../model/enums/error-code'

export class JsendResponseFormatter implements HttpResponseFormatter{
  public formatErrorResponse(message: string, errorCode: ErrorCode): object {
    return {
      status: 'error',
      code: errorCode,
      message: message,
    }
  }

  public formatFailResponse(data?: object): object {
    return {
      status: 'fail',
      data: data ? data : null
    }
  }

  public  formatSuccessResponse(data?: object): object {
    return {
      status: 'success',
      data: data ? data : null
    }
  }
}