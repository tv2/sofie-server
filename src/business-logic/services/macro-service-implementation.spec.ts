import { MacroServiceImplementation } from './macro-service-implementation'
import { MacroRepository } from '../../rundown-execution/domain/repositories/macro-repository'
import { anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { MacroEventEmitter } from '../../rundown-execution/application/interfaces/macro-event-emitter'
import { Macro, Operation } from '../../rundown-execution/domain/entities/macro'
import { EntityTestFactory } from '../../rundown-execution/domain/entities/test/entity-test-factory'
import { ActionService } from './interfaces/action-service'
import { Exception } from '../../rundown-execution/domain/exceptions/exception'
import { ErrorCode } from '../../rundown-execution/domain/enums/error-code'
import { StatusMessageEventEmitter } from '../../rundown-execution/application/interfaces/status-message-event-emitter'

describe(MacroServiceImplementation.name, () => {
  describe(MacroServiceImplementation.prototype.createMacro.name, () => {
    it('should emit macro created event', async () => {
      const macro: Macro = EntityTestFactory.createMacro()


      const mockedMacroEventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
      const mockedMacroRepository: MacroRepository = mock<MacroRepository>()
      when(mockedMacroRepository.createMacro(macro)).thenReturn(Promise.resolve(macro))

      const testee: MacroServiceImplementation = createTestee({macroEventEmitter: instance(mockedMacroEventEmitter), macroRepository: instance(mockedMacroRepository)})

      await testee.createMacro(macro)

      verify(mockedMacroEventEmitter.emitMacroCreatedEvent(macro)).once()
    })
  })

  it('should emit macro updated event', async () => {
    EntityTestFactory
    const macro: Macro = EntityTestFactory.createMacro()

    const mockedMacroEventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
    const mockedMacroRepository: MacroRepository = mock<MacroRepository>()
    when(mockedMacroRepository.updateMacro(macro)).thenReturn(Promise.resolve(macro))

    const testee: MacroServiceImplementation = createTestee({macroEventEmitter: instance(mockedMacroEventEmitter), macroRepository: instance(mockedMacroRepository)})

    await testee.updateMacro(macro)

    verify(mockedMacroEventEmitter.emitMacroUpdatedEvent(macro)).once()
  })
})

describe(MacroServiceImplementation.prototype.deleteMacro.name, () => {
  it('should emit macro deleted event', async () => {
    const macroId: string = 'FakeMacroId'

    const mockedMacroEventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
    const mockedMacroRepository: MacroRepository = mock<MacroRepository>()
    when(mockedMacroRepository.deleteMacro(macroId)).thenReturn(Promise.resolve())

    const testee: MacroServiceImplementation = createTestee({macroEventEmitter: instance(mockedMacroEventEmitter), macroRepository: instance(mockedMacroRepository)})

    await testee.deleteMacro(macroId)

    verify(mockedMacroEventEmitter.emitMacroDeletedEvent(macroId)).once()
  })
})

describe(MacroServiceImplementation.prototype.executeMacro.name, () => {
  it('should emit macro operation failed event', async () => {
    const macro: Macro = EntityTestFactory.createMacro({operations: [EntityTestFactory.createActionOperation({delayNextOperationMs: 200})]})

    const mockedStatusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
    const mockedActionService: ActionService = mock<ActionService>()
    const mockedMacroRepository: MacroRepository = mock<MacroRepository>()
    when(mockedMacroRepository.getMacro(macro.id)).thenReturn(Promise.resolve(macro))
    const failMessage: string = 'Failed at doing this action'
    const rundownId: string = 'MyRundownId'
    when(mockedActionService.executeAction).thenThrow(new Exception(ErrorCode.UNEXPECTED_CASE, failMessage))

    const testee: MacroServiceImplementation = createTestee({ statusMessageEmitter: instance(mockedStatusMessageEventEmitter), actionService: instance(mockedActionService), macroRepository: instance(mockedMacroRepository) })

    await testee.executeMacro(macro.id, rundownId)

    verify(mockedStatusMessageEventEmitter.emitStatusMessageEvent(anything())).once()
  })

  it('should call all 3 operations within timeframe of 401ms', async () => {
    jest.useFakeTimers()
    const operations: Operation[] = [
      EntityTestFactory.createActionOperation({actionId: 'MyActionId', delayNextOperationMs: 200 }),
      EntityTestFactory.createActionOperation({actionId: 'TAKE', delayNextOperationMs: 200 }),
      EntityTestFactory.createActionOperation({actionId: 'Something', delayNextOperationMs: 0}),
    ]
    const macro: Macro = EntityTestFactory.createMacro({operations: operations})

    const mockedActionService: ActionService = mock<ActionService>()
    const mockedMacroRepository: MacroRepository = mock<MacroRepository>()
    when(mockedMacroRepository.getMacro(macro.id)).thenReturn(Promise.resolve(macro))
    const rundownId: string = 'MyRundownId'

    when(mockedActionService.executeAction(anything(), anything(),anything())).thenResolve()

    const testee: MacroServiceImplementation = createTestee({ actionService: instance(mockedActionService), macroRepository: instance(mockedMacroRepository) })

    await testee.executeMacro(macro.id, rundownId)
    await jest.advanceTimersByTimeAsync(401)
    verify(mockedActionService.executeAction(operations[0].actionId, rundownId, anything())).once()
    verify(mockedActionService.executeAction(operations[1].actionId, rundownId, anything())).once()
    verify(mockedActionService.executeAction(operations[2].actionId, rundownId, anything())).once()

  })
})

function createTestee(params?: {statusMessageEmitter?: StatusMessageEventEmitter, macroEventEmitter?: MacroEventEmitter, actionService? : ActionService, macroRepository? : MacroRepository}): MacroServiceImplementation {
  return new MacroServiceImplementation(
    params?.statusMessageEmitter ?? mock<StatusMessageEventEmitter>(),
    params?.macroEventEmitter ?? mock<MacroEventEmitter>(),
    params?.macroRepository ?? mock<MacroRepository>(),
    params?.actionService ?? mock<ActionService>())
}


