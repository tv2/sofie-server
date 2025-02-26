import { Macro } from '../../../model/entities/macro'

export interface MacroEventEmitter {
  emitMacroCreatedEvent(macro: Macro): void
  emitMacroUpdatedEvent(macro: Macro): void
  emitMacroDeletedEvent(macroId: string): void
  emitMacroOperationFailedEvent(macro: Macro, operationIndex: number, message: string): void
}
