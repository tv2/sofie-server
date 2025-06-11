import { Macro } from '../domain/entities/macro'

export interface MacroEventEmitter {
  emitMacroCreatedEvent(macro: Macro): void
  emitMacroUpdatedEvent(macro: Macro): void
  emitMacroDeletedEvent(macroId: string): void
}
