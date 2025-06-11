import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { MacroEventType } from '../../../presentation/event-type'
import { MacroDto } from '../../application/dtos/macro-dto'

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