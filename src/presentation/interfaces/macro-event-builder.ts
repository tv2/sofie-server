import { Macro } from '../../model/entities/macro'
import {
  MacroCreatedEvent,
  MacroDeletedEvent, MacroOperationFailedEvent,
  MacroUpdatedEvent
} from '../value-objects/macro-event'

export interface MacroEventBuilder {
  buildMacroCreatedEvent(macro: Macro): MacroCreatedEvent
  buildMacroUpdatedEvent(macro: Macro): MacroUpdatedEvent
  buildMacroDeletedEvent(macroId: string): MacroDeletedEvent
  buildMacroOperationFailedEvent(macro: Macro, operationIndex: number, message: string): MacroOperationFailedEvent
}
