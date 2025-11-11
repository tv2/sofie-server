import {
  BaseController,
  GetRequest,
  PutRequest,
  RestController
} from '../../../cross-cutting-concerns/application/controllers/base-controller'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'
import { Request, Response } from 'express'
import { HttpResponseFormatter } from '../../../cross-cutting-concerns/application/interfaces/http-response-formatter'
import { HttpErrorHandler } from '../../../cross-cutting-concerns/application/interfaces/http-error-handler'
import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'
import { InewsIngestConfigurationDto } from '../dtos/inews-ingest-configuration-dto'
import { IngestService } from '../interfaces/ingest-service'
import { Exception } from '../../../cross-cutting-concerns/domain/exceptions/exception'

@RestController('tv2-inews-ingest')
export class Tv2InewsIngestController extends BaseController {
  public constructor(
    private readonly ingestService: IngestService,
    private readonly httpResponseFormatter: HttpResponseFormatter,
    private readonly httpErrorHandler: HttpErrorHandler
  ) {
    super()
  }

  @AuditLog()
  @GetRequest('configurations')
  public async getInewsIngestConfiguration(_request: Request, response: Response): Promise<void> {
    try {
      const inewsIngestConfiguration: InewsIngestConfiguration = await this.ingestService.getIngestConfiguration()
      response.send(this.httpResponseFormatter.formatSuccessResponse(new InewsIngestConfigurationDto(inewsIngestConfiguration)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PutRequest('configurations')
  public async saveInewsIngestConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const inewsIngestConfigurationDto: InewsIngestConfigurationDto = request.body as InewsIngestConfigurationDto
      const inewsIngestConfiguration: InewsIngestConfiguration = {
        queueSubscriptions: inewsIngestConfigurationDto.queueSubscriptions.map(subscription => ({
          queueId: subscription.queueId,
          isDisabled: subscription.isDisabled
        }))
      }
      await this.ingestService.saveIngestConfiguration(inewsIngestConfiguration)

      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
