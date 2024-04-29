import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { ActionService } from '../../business-logic/services/interfaces/action-service'
import { Action } from '../../model/entities/action'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { ActionDto } from '../dtos/action-dto'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'

interface ExecuteActionRequestBody {
  actionArguments: unknown
}

@RestController('/actions')
export class ActionController extends BaseController {

  constructor(
    private readonly actionService: ActionService,
    private readonly actionRepository: ActionRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest()
  public async getActions(_request: Request, response: Response): Promise<void> {
    try {
      const actions: Action[] = await this.actionRepository.getActions()
      response.send(this.httpResponseFormatter.formatSuccessResponse(actions.map(action => new ActionDto(action))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/rundowns/:rundownId')
  public async getActionsForRundown(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const actions: Action[] = await this.actionRepository.getActionsForRundown(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(actions.map(action => new ActionDto(action))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  /**
   * To pass along arguments for the Action provide a JSON object in the Request body that has the attribute "actionArguments".
   */
  @PutRequest('/:actionId/rundowns/:rundownId')
  public async executeAction(request: Request, response: Response): Promise<void> {
    try {
      const actionId: string = request.params.actionId
      const rundownId: string = request.params.rundownId
      const body: ExecuteActionRequestBody = request.body
      await this.actionService.executeAction(actionId, rundownId, body.actionArguments ?? undefined)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully executed action: ${actionId} on Rundown: ${rundownId}`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
