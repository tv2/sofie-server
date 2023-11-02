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

@RestController('/rundowns')
export class RundownController extends BaseController {
  constructor(
    private readonly rundownService: RundownService,
    private readonly rundownRepository: RundownRepository,
    private readonly ingestService: IngestService,
    private readonly httpErrorHandler: HttpErrorHandler
  ) {
    super()
  }

  @GetRequest('/basic')
  public async getBasicRundowns(_reg: Request, res: Response): Promise<void> {
    try {
      const basicRundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()
      res.send(basicRundowns.map((basicRundown) => new BasicRundownDto(basicRundown)))
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @GetRequest('/:rundownId')
  public async getRundown(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
      res.send(new RundownDto(rundown))
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PutRequest('/:rundownId/activate')
  public async activate(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      await this.rundownService.activateRundown(rundownId)
      res.send(`Rundown "${rundownId}" successfully activated`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PutRequest('/:rundownId/deactivate')
  public async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      await this.rundownService.deactivateRundown(rundownId)
      res.send(`Rundown "${rundownId}" successfully deactivated`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PutRequest('/:rundownId/takeNext')
  public async takeNext(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      await this.rundownService.takeNext(rundownId)
      res.send(`Rundown "${rundownId}" successfully took next`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PutRequest('/:rundownId/segments/:segmentId/parts/:partId/setNext')
  public async setNext(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      const segmentId: string = req.params.segmentId
      const partId: string = req.params.partId
      await this.rundownService.setNext(rundownId, segmentId, partId, Owner.EXTERNAL)
      res.send(`Part "${partId}" is now set as next`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PutRequest('/:rundownId/reset')
  public async resetRundown(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      await this.rundownService.resetRundown(rundownId)
      res.send(`Rundown "${rundownId}" has been reset`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PostRequest('/:rundownId/reingest')
  public async reloadRundownData(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      await this.ingestService.reloadIngestData(rundownId)
      res.send(`Reingested rundown data for ${rundownId}`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @DeleteRequest('/:rundownId')
  public async deleteRundown(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      await this.rundownService.deleteRundown(rundownId)
      res.send(`Rundown "${rundownId}" has been deleted`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }
}
