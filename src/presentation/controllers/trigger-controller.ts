import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { Request, Response } from 'express'
import { ActionTrigger, Trigger, TriggerType } from '../../model/entities/trigger'
import { ActionTriggerDto, MacroTriggerDto, TriggerDto } from '../dtos/trigger-dto'
import { TriggerService } from '../../business-logic/services/interfaces/trigger-service'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'

@RestController('/actionTriggers')
export class TriggerController extends BaseController {

  constructor(
    private readonly triggerService: TriggerService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest()
  public async getTriggers(_request: Request, response: Response): Promise<void> {
    try {
      const triggers: Trigger[] = await this.triggerService.getTriggers()
      response.send(this.httpResponseFormatter.formatSuccessResponse(triggers.map(trigger => new ActionTriggerDto(trigger as ActionTrigger))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest()
  public async createTrigger(request: Request, response: Response): Promise<void> {
    try {
      const triggerDto: TriggerDto = request.body as TriggerDto
      triggerDto.id = ''
      let trigger: Trigger
      switch(triggerDto.type) {
        case TriggerType.ACTION:
          trigger = this.mapToActionTrigger(triggerDto)
          break
        case TriggerType.MACRO:
          trigger = this.mapMacroTrigger(triggerDto)
          break
      }
      await this.triggerService.createTrigger(trigger)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully created Trigger for type of ${trigger.type}` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest()
  public async updateTrigger(request: Request, response: Response): Promise<void> {
    try {
      const triggerDto: TriggerDto = request.body as TriggerDto
      let trigger: Trigger
      switch(triggerDto.type) {
        case TriggerType.ACTION:
          trigger = this.mapToActionTrigger(triggerDto)
          break
        case TriggerType.MACRO:
          trigger = this.mapMacroTrigger(triggerDto)
          break
      }

      await this.triggerService.updateTrigger(trigger)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully updated Trigger type of ${trigger.type}, id: ${trigger.id}` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  private mapToActionTrigger(triggerDto: Partial<TriggerDto>): Trigger {
    return {
      ...triggerDto as ActionTriggerDto,
      type: TriggerType.ACTION,
    }
  }

  private mapMacroTrigger(triggerDto: Partial<TriggerDto>): Trigger {
    return {
      ...triggerDto as MacroTriggerDto,
      type: TriggerType.MACRO,
    }
  }

  @DeleteRequest('/:actionTriggerId')
  public async deleteTrigger(request: Request, response: Response): Promise<void> {
    try {
      const triggerId: string = request.params.actionTriggerId
      await this.triggerService.deleteTrigger(triggerId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully deleted Trigger ${triggerId}`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
