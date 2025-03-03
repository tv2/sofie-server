import { MacroServiceImplementation } from '../macro-service-implementation'
import { MacroRepository } from '../../../data-access/repositories/interfaces/macro-repository'
import { anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { MacroEventEmitter } from '../interfaces/macro-event-emitter'
import { Macro, Operation, OperationType } from '../../../model/entities/macro'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { ActionService } from '../interfaces/action-service'
import { Exception } from '../../../model/exceptions/exception'
import { ErrorCode } from '../../../model/enums/error-code'
import {StatusMessageEventEmitter} from '../interfaces/status-message-event-emitter'

describe(MacroServiceImplementation.name, () => {
  describe(MacroServiceImplementation.prototype.createMacro.name, () => {
    it('should emit macro created event', async () => {
      const macro: Macro = EntityTestFactory.createMacro()

      const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
      const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
      const actionService: ActionService = mock<ActionService>()
      const repo: MacroRepository = mock<MacroRepository>()
      when(repo.createMacro(macro)).thenReturn(Promise.resolve(macro))

      const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(statusMessageEventEmitter), instance(eventEmitter), instance(repo), instance(actionService))

      await testee.createMacro(macro)

      verify(eventEmitter.emitMacroCreatedEvent(macro)).once()
    })
  })

  it('should emit macro updated event', async () => {
    EntityTestFactory
    const macro: Macro = EntityTestFactory.createMacro()

    const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
    const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
    const actionService: ActionService = mock<ActionService>()
    const repo: MacroRepository = mock<MacroRepository>()
    when(repo.updateMacro(macro)).thenReturn(Promise.resolve(macro))

    const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(statusMessageEventEmitter) ,instance(eventEmitter), instance(repo), instance(actionService))

    await testee.updateMacro(macro)

    verify(eventEmitter.emitMacroUpdatedEvent(macro)).once()
  })
})

describe(MacroServiceImplementation.prototype.deleteMacro.name, () => {
  it('should emit macro deleted event', async () => {
    const macroId: string = 'FakeMacroId'

    const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
    const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
    const actionService: ActionService = mock<ActionService>()
    const repo: MacroRepository = mock<MacroRepository>()
    when(repo.deleteMacro(macroId)).thenReturn(Promise.resolve())

    const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(statusMessageEventEmitter), instance(eventEmitter), instance(repo), instance(actionService))

    await testee.deleteMacro(macroId)

    verify(eventEmitter.emitMacroDeletedEvent(macroId)).once()
  })
})

describe(MacroServiceImplementation.prototype.executeMacro.name, () => {
  it('should emit macro operation failed event', async () => {
    const operations: Operation[] = [{
      type: OperationType.ACTION,
      delayNextOperationMs: 200,
      actionId: 'MyActionId'
    }]
    const macro: Macro = EntityTestFactory.createMacro({operations: operations})

    const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
    const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
    const actionService: ActionService = mock<ActionService>()
    const repo: MacroRepository = mock<MacroRepository>()
    when(repo.getMacro(macro.id)).thenReturn(Promise.resolve(macro))
    const failMessage: string = 'Failed at doing this action'
    const rundownId: string = 'MyRundownId'
    when(actionService.executeAction).thenThrow(new Exception(ErrorCode.UNEXPECTED_CASE, failMessage))

    const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(statusMessageEventEmitter), instance(eventEmitter), instance(repo), instance(actionService))

    await testee.executeMacro(macro.id, rundownId)

    verify(statusMessageEventEmitter.emitStatusMessageEvent(anything())).once()
  })

  it('should call all 3 operations within timeframe of 401ms', async () => {
    jest.useFakeTimers()
    const operations: Operation[] = [{
      type: OperationType.ACTION,
      delayNextOperationMs: 200,
      actionId: 'MyActionId'
    }, {
      type: OperationType.ACTION,
      delayNextOperationMs: 200,
      actionId: 'TAKE'
    }, {
      type: OperationType.ACTION,
      delayNextOperationMs: 0,
      actionId: 'Something'
    }]
    const macro: Macro = EntityTestFactory.createMacro({operations: operations})

    const statusEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
    const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
    const actionService: ActionService = mock<ActionService>()
    const repo: MacroRepository = mock<MacroRepository>()
    when(repo.getMacro(macro.id)).thenReturn(Promise.resolve(macro))
    const rundownId: string = 'MyRundownId'

    when(actionService.executeAction(anything(), anything(),anything())).thenResolve()

    const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(statusEventEmitter), instance(eventEmitter), instance(repo), instance(actionService))

    await testee.executeMacro(macro.id, rundownId)
    await jest.advanceTimersByTimeAsync(401)
    verify(actionService.executeAction(operations[0].actionId, rundownId, anything())).once()
    verify(actionService.executeAction(operations[1].actionId, rundownId, anything())).once()
    verify(actionService.executeAction(operations[2].actionId, rundownId, anything())).once()

  })
})
