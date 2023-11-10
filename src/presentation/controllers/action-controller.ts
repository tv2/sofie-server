import { BaseController, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { ActionService } from '../../business-logic/services/interfaces/action-service'
import { Action } from '../../model/entities/action'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { ActionDto } from '../dtos/action-dto'
import { ActionTriggerRepository } from '../../data-access/repositories/interfaces/action-trigger-repository'
import { ActionTrigger } from '../../model/value-objects/action-trigger'

@RestController('/actions')
export class ActionController extends BaseController {

  constructor(
    private readonly actionService: ActionService,
    private readonly actionTriggerRepository: ActionTriggerRepository,
    private readonly httpErrorHandler: HttpErrorHandler
  ) {
    super()
  }

  @GetRequest('/rundowns/:rundownId')
  public async getActions(_reg: Request, res: Response): Promise<void> {
    try {
      const actions: Action[] = await this.actionService.getActions()
      res.send(actions.map(action => new ActionDto(action)))
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PutRequest('/:actionId/rundowns/:rundownId')
  public async executeAction(reg: Request, res: Response): Promise<void> {
    try {
      const actionId: string = reg.params.actionId
      const rundownId: string = reg.params.rundownId
      await this.actionService.executeAction(actionId, rundownId)
      res.send(`Successfully executed action: ${actionId} on Rundown: ${rundownId}`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @GetRequest('/triggers')
  public async getActionTriggers(_reg: Request, res: Response): Promise<void> {
    try {
      const actionTriggers: ActionTrigger[] = await this.actionTriggerRepository.getActionTriggers()
      res.send(actionTriggers)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PostRequest('/triggers')
  public async saveActionTrigger(reg: Request, res: Response): Promise<void> {
    try {
      const actionTrigger: ActionTrigger = reg.body as ActionTrigger
      await this.actionTriggerRepository.saveActionTrigger(actionTrigger)
      res.send(`Successfully saved ActionTrigger ${actionTrigger.id}`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }
}
