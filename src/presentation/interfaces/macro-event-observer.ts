import { MacroEvent } from '../value-objects/macro-event'

export interface MacroEventObserver {
  subscribeToMacroEvents(onMacroEventCallback: (macroEvent: MacroEvent) => void): void
}
