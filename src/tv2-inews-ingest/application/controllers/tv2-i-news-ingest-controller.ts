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
import { Exception } from '../../../rundown-execution/domain/exceptions/exception'
import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'
import { INewsIngestConfigurationDto } from '../dtos/i-news-ingest-configuration-dto'
import { IngestService } from '../interfaces/ingest-service'

@RestController('tv2-i-news-ingest')
export class Tv2INewsIngestController extends BaseController {
  public constructor(
    private readonly ingestService: IngestService,
    private readonly httpResponseFormatter: HttpResponseFormatter,
    private readonly httpErrorHandler: HttpErrorHandler
  ) {
    super()
  }

  @AuditLog()
  @GetRequest('configurations')
  public async getINewsIngestConfiguration(_request: Request, response: Response): Promise<void> {
    try {
      const iNewsIngestConfiguration: INewsIngestConfiguration = await this.ingestService.getIngestConfiguration()
      response.send(this.httpResponseFormatter.formatSuccessResponse(new INewsIngestConfigurationDto(iNewsIngestConfiguration)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PutRequest('configurations')
  public async saveINewsIngestConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const iNewsIngestConfigurationDto: INewsIngestConfigurationDto = request.body as INewsIngestConfigurationDto
      const iNewsIngestConfiguration: INewsIngestConfiguration = {
        queueSubscriptions: iNewsIngestConfigurationDto.queueSubscriptions.map(subscription => ({
          queueId: subscription.queueId,
          isDisabled: subscription.isDisabled
        }))
      }
      await this.ingestService.saveIngestConfiguration(iNewsIngestConfiguration)

      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
