import { BaseController, PutRequest, RestController } from './base-controller'
import { Logger, LogLevel } from '../interfaces/logger'
import { Request, Response } from 'express'
import { ExhaustiveCaseChecker } from '../../domain/services/exhaustive-case-checker'
import { Exception } from '../../domain/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { AuditLog } from '../decorators/audit-log-decorator'

@RestController('/loggers')
export class LoggerController extends BaseController {
  private readonly logger: Logger

  public constructor(
    private readonly httpResponseFormatter: HttpResponseFormatter,
    private readonly httpErrorHandler: HttpErrorHandler,
    logger: Logger
  ) {
    super()
    this.logger = logger.tag(this.constructor.name)
  }

  @AuditLog()
  @PutRequest('/level/:level')
  public setLogLevel(request: Request, response: Response): void {
    const logLevel: string = request.params.level
    try {
      this.assertLogLevel(logLevel)
      this.logger.setLevel(logLevel)
      this.logger.info(`Log level changed to '${logLevel}'.`)
      response.send(this.httpResponseFormatter.formatSuccessResponse({ logLevel }))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  private assertLogLevel(level: string): asserts level is LogLevel {
    if (!Object.values<string>(LogLevel).includes(level)) {
      ExhaustiveCaseChecker.assertAllCases(level as never, 'log level')
    }
  }
}
