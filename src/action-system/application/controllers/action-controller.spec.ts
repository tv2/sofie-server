import { ActionController } from './action-controller'
import { anything, instance, mock, verify } from '@typestrong/ts-mockito'
import { Request, Response } from 'express'
import { ActionService } from '../interfaces/action-service'
import { HttpErrorHandler } from '../../../cross-cutting-concerns/application/interfaces/http-error-handler'
import { HttpResponseFormatter } from '../../../cross-cutting-concerns/application/interfaces/http-response-formatter'

describe(ActionController.name, () => {
  describe(ActionController.prototype.executeAction.name, () => {
    it('receives null as the value for ActionArguments, it converts it to undefined', async() => {
      const actionService: ActionService = mock<ActionService>()
      const request: Request = {
        params: {},
        body: {
          actionArguments: null
        }
      } as Request

      const testee: ActionController = createTestee({ actionService })
      await testee.executeAction(request, {} as Response)

      verify(actionService.executeAction(anything(), anything(), undefined)).once()
    })

    it('receives an object as ActionArguments, it doesnt modify the object', async() => {
      const actionService: ActionService = mock<ActionService>()
      const actionArguments: { [key: string]: string } = {
        some: 'argument'
      }
      const request: Request = {
        params: {},
        body: {
          actionArguments
        }
      } as Request

      const testee: ActionController = createTestee({ actionService })
      await testee.executeAction(request, {} as Response)

      verify(actionService.executeAction(anything(), anything(), actionArguments)).once()
    })
  })
})

function createTestee(params?: {
  actionService?: ActionService
}): ActionController {
  const actionServiceMock: ActionService = params?.actionService ?? mock<ActionService>()
  return new ActionController(instance(actionServiceMock), instance(mock<HttpErrorHandler>()), instance(mock<HttpResponseFormatter>()))
}
