import { Request, Response } from 'express'
import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from '../../../cross-cutting-concerns/application/controllers/base-controller'
import { RundownService } from '../interfaces/rundown-service'
import { RundownRepository } from '../../domain/repositories/rundown-repository'
import { Rundown } from '../../domain/entities/rundown'
import { RundownDto } from '../dtos/rundown-dto'
import { Exception } from '../../domain/exceptions/exception'
import { HttpErrorHandler } from '../../../cross-cutting-concerns/application/interfaces/http-error-handler'
import { BasicRundown } from '../../domain/entities/basic-rundown'
import { BasicRundownDto } from '../dtos/basic-rundown-dto'
import { Owner } from '../../domain/enums/owner'
import { IngestService } from '../../../sofie-ingest/application/interfaces/ingest-service'
import { HttpResponseFormatter } from '../../../cross-cutting-concerns/application/interfaces/http-response-formatter'
import { SetNextDirection } from '../../domain/enums/set-next-direction'
import { TakeMode } from '../../domain/enums/take-mode'
import { Tv2Logger } from '../../../blueprints/domain/interfaces/tv2-logger'
import { ErrorCode } from '../../domain/enums/error-code'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'
import { PlayoutContentReadService } from '../interfaces/playout-content-service'
import { PlayoutContent } from '../../domain/value-objects/playout-content'

@RestController('/rundowns')
export class RundownController extends BaseController {
  constructor(
    private readonly rundownService: RundownService,
    private readonly rundownRepository: RundownRepository,
    private readonly ingestService: IngestService,
    private readonly playoutContentService: PlayoutContentReadService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter,
    private readonly logger: Tv2Logger
  ) {
    super()
    this.logger = logger.tag(this.constructor.name)
  }

  @AuditLog()
  @GetRequest('/basic')
  public async getBasicRundowns(_request: Request, response: Response): Promise<void> {
    try {
      const basicRundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()
      response.send(this.httpResponseFormatter.formatSuccessResponse(basicRundowns.map(basicRundown => new BasicRundownDto(basicRundown))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
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

  @AuditLog()
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

  @AuditLog()
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

  @AuditLog()
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

  @AuditLog()
  @PutRequest('/:rundownId/takeMode/:takeMode')
  public async takeMode(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const takeMode: TakeMode = TakeMode[request.params.takeMode as keyof typeof TakeMode]
      if (takeMode === undefined) {
        const errorMessage: string = `Rundown "${rundownId}" failed to set it's Take Mode, since "${request.params.takeMode}" isn't a valid input.`
        this.logger.error(errorMessage)
        response.send(this.httpResponseFormatter.formatErrorResponse(errorMessage, ErrorCode.BAD_REQUEST))
        return
      }
      await this.rundownService.setTakeMode(rundownId, takeMode)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Rundown "${rundownId}" successfully set Take Mode to ${takeMode}` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
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

  @AuditLog()
  @PutRequest('/:rundownId/segments/:segmentId/parts/:partId/setNext')
  public async setNextFromIds(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const segmentId: string = request.params.segmentId
      const partId: string = request.params.partId
      await this.rundownService.setNextFromIds(rundownId, segmentId, partId, Owner.EXTERNAL)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Part "${partId}" is now set as next`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PutRequest('/:rundownId/setNext/:direction')
  public async setNext(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const setNextDirection: SetNextDirection = request.params.direction as SetNextDirection
      await this.rundownService.setNextFromDirection(rundownId, setNextDirection, Owner.EXTERNAL)
      response.send(this.httpResponseFormatter.formatSuccessResponse('Successfully set next'))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
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

  @AuditLog()
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

  @AuditLog()
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

  @AuditLog()
  @PutRequest('/:rundownId/pieces/:pieceId/stop')
  public async stopPiece(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const pieceId: string = request.params.pieceId
      await this.rundownService.stopPiece(rundownId, pieceId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Piece "${pieceId}" was stopped` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @GetRequest(':rundownId/playoutContents')
  public getPlayoutContents(_request: Request, response: Response): void {
    try {
      const programPlayoutContentState: readonly PlayoutContent[] = this.playoutContentService.getProgramPlayoutContentState()
      const previewPlayoutContentState: readonly PlayoutContent[] = this.playoutContentService.getPreviewPlayoutContentState()
      response.send(this.httpResponseFormatter.formatSuccessResponse({
        program: programPlayoutContentState,
        preview: previewPlayoutContentState
      }))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
