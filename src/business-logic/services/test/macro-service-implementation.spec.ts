import { MacroServiceImplementation } from '../macro-service-implementation'
import { MacroRepository } from '../../../data-access/repositories/interfaces/macro-repository'
import { instance, mock, verify, when } from '@typestrong/ts-mockito'
import { MacroEventEmitter } from '../interfaces/macro-event-emitter'
import { Macro } from '../../../model/entities/macro'

describe(MacroServiceImplementation.name, () => {
  describe(MacroServiceImplementation.prototype.createMacro.name, () => {
    it('should emit macro created event', async () => {
      const macro: Macro = { id: 'FakeMacroId', name: 'FakeMacro', operations: [] } as Macro

      const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
      const repo: MacroRepository = mock<MacroRepository>()
      when(repo.createMacro(macro)).thenReturn(Promise.resolve(macro))

      const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(eventEmitter), instance(repo))

      await testee.createMacro(macro)

      verify(eventEmitter.emitMacroCreatedEvent(macro)).once()
    })
  })

  describe(MacroServiceImplementation.prototype.updateMacro.name, () => {
    it('should emit macro updated event', async () => {
      const macro: Macro = { id: 'FakeMacroId', name: 'FakeMacro', operations: [] } as Macro

      const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
      const repo: MacroRepository = mock<MacroRepository>()
      when(repo.updateMacro(macro)).thenReturn(Promise.resolve(macro))

      const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(eventEmitter), instance(repo))

      await testee.updateMacro(macro)

      verify(eventEmitter.emitMacroUpdatedEvent(macro)).once()
    })
  })

  describe(MacroServiceImplementation.prototype.deleteMacro.name, () => {
    it('should emit macro deleted event', async () => {
      const macroId: string = 'FakeMacroId'

      const eventEmitter: MacroEventEmitter = mock<MacroEventEmitter>()
      const repo: MacroRepository = mock<MacroRepository>()
      when(repo.deleteMacro(macroId)).thenReturn(Promise.resolve())

      const testee: MacroServiceImplementation = new MacroServiceImplementation(instance(eventEmitter), instance(repo))

      await testee.deleteMacro(macroId)

      verify(eventEmitter.emitMacroDeletedEvent(macroId)).once()
    })
  })
})
