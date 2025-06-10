import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from '../../../cross-cutting-concerns/application/base-controller'
import { HttpErrorHandler } from '../../../presentation/interfaces/http-error-handler'
import { Exception } from '../../domain/exceptions/exception'
import { Request, Response } from 'express'
import { Trigger } from '../../domain/entities/trigger'
import { TriggerDto } from '../dtos/trigger-dto'
import { TriggerService } from '../../../business-logic/services/interfaces/trigger-service'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

@RestController('/triggers')
export class TriggerController extends BaseController {

  constructor(
    private readonly triggerService: TriggerService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @AuditLog()
  @GetRequest()
  public async getTriggers(_request: Request, response: Response): Promise<void> {
    try {
      const triggers: Trigger[] = await this.triggerService.getTriggers()
      response.send(this.httpResponseFormatter.formatSuccessResponse(triggers.map(trigger => TriggerDto.createTriggerDto(trigger))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PostRequest()
  public async createTrigger(request: Request, response: Response): Promise<void> {
    try {
      const trigger: Trigger = TriggerDto.toEntity(request.body as TriggerDto)
      await this.triggerService.createTrigger(trigger)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully created Trigger for type of ${trigger.type}` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PutRequest()
  public async updateTrigger(request: Request, response: Response): Promise<void> {
    try {
      const trigger: Trigger = TriggerDto.toEntity(request.body as TriggerDto)
      await this.triggerService.updateTrigger(trigger)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully updated Trigger type of ${trigger.type}, id: ${trigger.id}` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @DeleteRequest('/:triggerId')
  public async deleteTrigger(request: Request, response: Response): Promise<void> {
    try {
      const triggerId: string = request.params.triggerId
      await this.triggerService.deleteTrigger(triggerId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully deleted Trigger ${triggerId}`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
