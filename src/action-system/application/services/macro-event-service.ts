import { MacroEventEmitter } from '../interfaces/macro-event-emitter'
import { MacroEventObserver } from '../interfaces/macro-event-observer'
import { MacroEventBuilder } from '../interfaces/macro-event-builder'
import {
  MacroCreatedEvent, MacroDeletedEvent,
  MacroEvent,
  MacroUpdatedEvent
} from '../../domain/value-objects/macro-event'
import { Macro } from '../../domain/entities/macro'

export class MacroEventService implements MacroEventEmitter, MacroEventObserver {
  private static instance: MacroEventService

  public static getInstance(macroEventBuilder: MacroEventBuilder): MacroEventService {
    if (!this.instance) {
      this.instance = new MacroEventService(macroEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((macroEvent: MacroEvent) => void)[] = []

  constructor(private readonly macroEventBuilder: MacroEventBuilder) { }

  private emitMacroEvent(macroEvent: MacroEvent): void {
    this.callbacks.forEach(callback => callback(macroEvent))
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

  public subscribeToMacroEvents(onMacroEventCallback: (macroEvent: MacroEvent) => void): void {
    this.callbacks.push(onMacroEventCallback)
  }
}
