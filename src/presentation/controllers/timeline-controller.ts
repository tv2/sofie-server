import { BaseController, GetRequest, RestController } from './base-controller'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { Request, Response } from 'express'
import { Timeline } from '../../model/entities/timeline'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'

@RestController('/timelines')
export class TimelineController extends BaseController {
  constructor(
    private readonly timelineRepository: TimelineRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest()
  public async getTimeline(_req: Request, res: Response): Promise<void> {
    try {
      const timeline: Timeline = await this.timelineRepository.getTimeline()
      res.send(this.httpResponseFormatter.formatSuccessResponse(timeline))
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }
}
