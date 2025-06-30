import { Request, Response } from 'express'
import {
  BaseController,
  GetRequest,
  RestController
} from '../../../cross-cutting-concerns/application/controllers/base-controller'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'
import { HttpErrorHandler } from '../../../cross-cutting-concerns/application/interfaces/http-error-handler'
import { Exception } from '../../../rundown-execution/domain/exceptions/exception'
import { IngestGatewayConnector } from '../interfaces/ingest-gateway-connector'
import { HttpResponseFormatter } from '../../../cross-cutting-concerns/application/interfaces/http-response-formatter'
import { IngestHealthStatus } from '../enum/ingest-health-status'

@RestController('/ingest')
export class IngestController extends BaseController {
  public constructor(
    private readonly ingestGatewayConnector: IngestGatewayConnector,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @AuditLog()
  @GetRequest('/status')
  public getIngestHealthStatus(_request: Request, response: Response): void {
    try {
      const ingestHealthStatus: IngestHealthStatus = this.ingestGatewayConnector.getStatus()
      response.send(this.httpResponseFormatter.formatSuccessResponse(ingestHealthStatus))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
