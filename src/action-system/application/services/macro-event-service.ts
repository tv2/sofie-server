import { MacroEventEmitter } from '../interfaces/macro-event-emitter'
import { MacroEventBuilder } from '../interfaces/macro-event-builder'
import {
  MacroCreatedEvent, MacroDeletedEvent,
  MacroEvent,
  MacroUpdatedEvent
} from '../value-objects/macro-event'
import { Macro } from '../../domain/entities/macro'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class MacroEventService implements MacroEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly macroEventBuilder: MacroEventBuilder) { }

  private emitMacroEvent(macroEvent: MacroEvent): void {
    this.typedEventEmitter.emitTypedEvent(macroEvent)
  }

  public emitMacroCreatedEvent(macro: Macro): void {
    const event: MacroCreatedEvent = this.macroEventBuilder.buildMacroCreatedEvent(macro)
    this.emitMacroEvent(event)
  }

  public emitMacroUpdatedEvent(macro: Macro): void {
    const event: MacroUpdatedEvent = this.macroEventBuilder.buildMacroUpdatedEvent(macro)
    this.emitMacroEvent(event)
  }

  public emitMacroDeletedEvent(macroId: string): void {
    const event: MacroDeletedEvent = this.macroEventBuilder.buildMacroDeletedEvent(macroId)
    this.emitMacroEvent(event)
  }
}
