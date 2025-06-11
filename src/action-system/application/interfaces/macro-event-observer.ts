import { MacroEvent } from '../../domain/value-objects/macro-event'

export interface MacroEventObserver {
  subscribeToMacroEvents(onMacroEventCallback: (macroEvent: MacroEvent) => void): void
}
