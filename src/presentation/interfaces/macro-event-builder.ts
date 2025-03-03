import { Macro } from '../../model/entities/macro'
import {
  MacroCreatedEvent,
  MacroDeletedEvent,
  MacroUpdatedEvent
} from '../value-objects/macro-event'

export interface MacroEventBuilder {
  buildMacroCreatedEvent(macro: Macro): MacroCreatedEvent
  buildMacroUpdatedEvent(macro: Macro): MacroUpdatedEvent
  buildMacroDeletedEvent(macroId: string): MacroDeletedEvent
}
