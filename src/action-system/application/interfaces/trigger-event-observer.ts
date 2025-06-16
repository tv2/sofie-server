import { TriggerEvent } from '../../domain/value-objects/trigger-event'

export interface TriggerEventObserver {
  subscribeToTriggerEvents(onTriggerEventCallback: (triggerEvent: TriggerEvent) => void): void
}
