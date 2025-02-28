import { TriggerEvent } from '../value-objects/trigger-event'

export interface TriggerEventObserver {
  subscribeToTriggerEvents(onTriggerEventCallback: (actionTriggerEvent: TriggerEvent) => void): void
}
