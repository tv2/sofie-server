import { ActionTriggerEvent } from '../value-objects/action-trigger-event'

export interface ActionTriggerEventObserver {
  subscribeToActionTriggerEvents(onActionTriggerEventCallback: (actionTriggerEvent: ActionTriggerEvent) => void): void
}
