import { BaseController, GetRequest, RestController } from '../../../cross-cutting-concerns/application/controllers/base-controller'
import { TimelineRepository } from '../../domain/repositories/timeline-repository'
import { Request, Response } from 'express'
import { Timeline } from '../../domain/entities/timeline'
import { HttpErrorHandler } from '../../../cross-cutting-concerns/application/interfaces/http-error-handler'
import { Exception } from '../../domain/exceptions/exception'
import { HttpResponseFormatter } from '../../../cross-cutting-concerns/application/interfaces/http-response-formatter'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

@RestController('/timelines')
export class TimelineController extends BaseController {
  public constructor(
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
