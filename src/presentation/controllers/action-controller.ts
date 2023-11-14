import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { ActionService } from '../../business-logic/services/interfaces/action-service'
import { Action } from '../../model/entities/action'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { ActionDto } from '../dtos/action-dto'

@RestController('/actions')
export class ActionController extends BaseController {

  constructor(private readonly actionService: ActionService, private readonly httpErrorHandler: HttpErrorHandler) {
    super()
  }

  @GetRequest('/rundowns/:rundownId')
  public async getActions(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      const actions: Action[] = await this.actionService.getActions(rundownId)
      res.send(actions.map(action => new ActionDto(action)))
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @PutRequest('/:actionId/rundowns/:rundownId')
  public async executeAction(req: Request, res: Response): Promise<void> {
    try {
      const actionId: string = req.params.actionId
      const rundownId: string = req.params.rundownId
      await this.actionService.executeAction(actionId, rundownId)
      res.send(`Successfully executed action: ${actionId} on Rundown: ${rundownId}`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }
}
