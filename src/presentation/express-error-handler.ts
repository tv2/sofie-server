import { Response } from 'express'
import { Exception } from '../model/exceptions/exception'
import { ErrorCode } from '../model/enums/error-code'
import { HttpStatusCode } from './http-status-code'
import { HttpErrorHandler } from './interfaces/http-error-handler'
import { Logger } from '../logger/logger'
import { HttpResponseFormatter } from './interfaces/http-response-formatter'

export class ExpressErrorHandler implements HttpErrorHandler {

  private readonly logger: Logger

  constructor(private readonly httpResponseFormatter: HttpResponseFormatter, logger: Logger) {
    this.logger = logger.tag(ExpressErrorHandler.name)
  }
  public handleError(response: Response, exception: Exception): void {
    this.logger.data(exception).error(`Caught Exception: "${exception.errorCode}". Message: ${exception.message}`)

    response.status(this.getStatusCode(exception.errorCode)).send(this.httpResponseFormatter.formatErrorResponseFromException(exception))
  }

  private getStatusCode(errorCode: ErrorCode): number {
    switch (errorCode) {
      case ErrorCode.NOT_ACTIVATED:
      case ErrorCode.ALREADY_ACTIVATED:
      case ErrorCode.END_OF_RUNDOWN:
      case ErrorCode.RUNDOWN_IS_ACTIVE:
      case ErrorCode.LAST_PART_IN_SEGMENT: {
        return HttpStatusCode.BAD_REQUEST
      }
      case ErrorCode.NOT_FOUND: {
        return HttpStatusCode.NOT_FOUND
      }
      case ErrorCode.MISCONFIGURATION:
      case ErrorCode.DELETION_FAILED: {
        return HttpStatusCode.INTERNAL_SERVER_ERROR
      }
      case ErrorCode.DATABASE_NOT_CONNECTED: {
        return HttpStatusCode.SERVICE_UNAVAILABLE
      }
      default: {
        return HttpStatusCode.INTERNAL_SERVER_ERROR
      }
    }
  }
}
