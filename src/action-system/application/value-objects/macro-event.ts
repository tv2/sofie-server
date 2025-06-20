import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { MacroDto } from '../dtos/macro-dto'
import { MacroEventType } from '../enums/macro-event-type'

export type MacroEvent = MacroCreatedEvent | MacroUpdatedEvent | MacroDeletedEvent

export interface MacroCreatedEvent extends TypedEvent {
  type: MacroEventType.MACRO_CREATED
  macro: MacroDto
}

export interface MacroUpdatedEvent extends TypedEvent {
  type: MacroEventType.MACRO_UPDATED
  macro: MacroDto
}

export interface MacroDeletedEvent extends TypedEvent {
  type: MacroEventType.MACRO_DELETED
  macroId: string
}
