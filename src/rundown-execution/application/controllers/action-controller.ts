import { BaseController, GetRequest, PutRequest, RestController } from '../../../cross-cutting-concerns/application/base-controller'
import { Request, Response } from 'express'
import { ActionService } from '../../../business-logic/services/interfaces/action-service'
import { Action } from '../../domain/entities/action'
import { HttpErrorHandler } from '../../../presentation/interfaces/http-error-handler'
import { Exception } from '../../domain/exceptions/exception'
import { ActionDto } from '../dtos/action-dto'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

interface ExecuteActionRequestBody {
  actionArguments: unknown
}

@RestController('/actions')
export class ActionController extends BaseController {

  constructor(
    private readonly actionService: ActionService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @AuditLog()
  @GetRequest()
  public async getActions(_request: Request, response: Response): Promise<void> {
    try {
      const actions: Action[] = await this.actionService.getSystemActions()
      response.send(this.httpResponseFormatter.formatSuccessResponse(actions.map(action => new ActionDto(action))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @GetRequest('/rundowns/:rundownId')
  public async getActionsForRundown(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const actions: Action[] = await this.actionService.getActionsForRundown(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(actions.map(action => new ActionDto(action))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  /**
   * To pass along arguments for the Action provide a JSON object in the Request body that has the attribute "actionArguments".
   */
  @AuditLog()
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
