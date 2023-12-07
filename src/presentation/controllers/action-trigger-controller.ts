import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { Request, Response } from 'express'
import { ActionTrigger } from '../../model/entities/action-trigger'
import { ActionTriggerDto } from '../dtos/action-trigger-dto'
import { ActionTriggerService } from '../../business-logic/services/interfaces/action-trigger-service'

@RestController('/actionTriggers')
export class ActionTriggerController extends BaseController {

  constructor(private readonly actionTriggerService: ActionTriggerService, private readonly httpErrorHandler: HttpErrorHandler) {
    super()
  }

  @GetRequest()
  public async getActionTriggers(_request: Request, response: Response): Promise<void> {
    try {
      const actionTriggers: ActionTrigger[] = await this.actionTriggerService.getActionTriggers()
      response.send(actionTriggers.map(actionTrigger => new ActionTriggerDto(actionTrigger)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest()
  public async createActionTrigger(request: Request, response: Response): Promise<void> {
    try {
      const actionTriggerDto: ActionTriggerDto = request.body as ActionTriggerDto
      const actionTrigger: ActionTrigger = {
        id: '', // No id has been created yet. The database will handle that for us
        actionId: actionTriggerDto.actionId,
        data: actionTriggerDto.data
      }
      await this.actionTriggerService.createActionTrigger(actionTrigger)
      response.send(`Successfully created ActionTrigger for Action ${actionTrigger.actionId}`)
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest()
  public async updateActionTrigger(request: Request, response: Response): Promise<void> {
    try {
      const actionTriggerDto: ActionTriggerDto = request.body as ActionTriggerDto
      const actionTrigger: ActionTrigger = {
        id: actionTriggerDto.id,
        actionId: actionTriggerDto.actionId,
        data: actionTriggerDto.data
      }
      await this.actionTriggerService.updateActionTrigger(actionTrigger)
      response.send(`Successfully updated ActionTrigger ${actionTrigger.id}`)
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @DeleteRequest('/:actionTriggerId')
  public async deleteActionTrigger(request: Request, response: Response): Promise<void> {
    try {
      const actionTriggerId: string = request.params.actionTriggerId
      await this.actionTriggerService.deleteActionTrigger(actionTriggerId)
      response.send(`Successfully deleted ActionTrigger ${actionTriggerId}`)
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
