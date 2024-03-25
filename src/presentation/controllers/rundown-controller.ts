import { Request, Response } from 'express'
import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { RundownService } from '../../business-logic/services/interfaces/rundown-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { RundownDto } from '../dtos/rundown-dto'
import { Exception } from '../../model/exceptions/exception'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { BasicRundown } from '../../model/entities/basic-rundown'
import { BasicRundownDto } from '../dtos/basic-rundown-dto'
import { Owner } from '../../model/enums/owner'
import { IngestService } from '../../business-logic/services/interfaces/ingest-service'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'

@RestController('/rundowns')
export class RundownController extends BaseController {
  constructor(
    private readonly rundownService: RundownService,
    private readonly rundownRepository: RundownRepository,
    private readonly ingestService: IngestService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest('/basic')
  public async getBasicRundowns(_request: Request, response: Response): Promise<void> {
    try {
      const basicRundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()
      response.send(this.httpResponseFormatter.formatSuccessResponse(basicRundowns.map(basicRundown => new BasicRundownDto(basicRundown))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/:rundownId')
  public async getRundown(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new RundownDto(rundown)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/:rundownId/activate')
  public async activate(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      await this.rundownService.activateRundown(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Rundown "${rundownId}" successfully activated`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/:rundownId/rehearse')
  public async enterRehearsal(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      await this.rundownService.enterRehearsal(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Rundown "${rundownId}" successfully entered rehearsal`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/:rundownId/deactivate')
  public async deactivate(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      await this.rundownService.deactivateRundown(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Rundown "${rundownId}" successfully deactivated` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/:rundownId/takeNext')
  public async takeNext(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      await this.rundownService.takeNext(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Rundown "${rundownId}" successfully took next`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/:rundownId/segments/:segmentId/parts/:partId/setNext')
  public async setNext(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const segmentId: string = request.params.segmentId
      const partId: string = request.params.partId
      await this.rundownService.setNext(rundownId, segmentId, partId, Owner.EXTERNAL)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Part "${partId}" is now set as next`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/:rundownId/reset')
  public async resetRundown(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      await this.rundownService.resetRundown(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Rundown "${rundownId}" has been reset` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest('/:rundownId/reingest')
  public async reloadRundownData(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      await this.ingestService.reloadIngestData(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Reingested rundown data for ${rundownId}`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @DeleteRequest('/:rundownId')
  public async deleteRundown(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      await this.rundownService.deleteRundown(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Rundown "${rundownId}" has been deleted` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
