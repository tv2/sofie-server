import { BaseController, GetRequest, RestController } from '../../../cross-cutting-concerns/application/base-controller'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { Request, Response } from 'express'
import { Timeline } from '../../../model/entities/timeline'
import { HttpErrorHandler } from '../../../presentation/interfaces/http-error-handler'
import { Exception } from '../../../model/exceptions/exception'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

@RestController('/timelines')
export class TimelineController extends BaseController {
  constructor(
    private readonly timelineRepository: TimelineRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @AuditLog()
  @GetRequest()
  public async getTimeline(_request: Request, response: Response): Promise<void> {
    try {
      const timeline: Timeline = await this.timelineRepository.getTimeline()
      response.send(this.httpResponseFormatter.formatSuccessResponse(timeline))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
