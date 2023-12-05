import { HttpResponseFormatter } from './interfaces/http-response-formatter'
import { ErrorCode } from '../model/enums/error-code'

export class JsendResponseFormatter implements HttpResponseFormatter{
  public buildErrorResponse(message: string, errorCode: ErrorCode): object {
    return {
      status: 'error',
      code: errorCode,
      message: message,
    }
  }

  public buildFailResponse(data: object): object {
    return {
      status: 'fail',
      data
    }
  }

  public  buildSuccessResponse(data: object): object {
    return {
      status: 'success',
      data
    }
  }


}