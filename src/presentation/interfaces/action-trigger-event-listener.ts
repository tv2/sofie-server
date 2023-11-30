import { ActionTriggerEvent } from '../value-objects/action-trigger-event'

export interface ActionTriggerEventListener {
  listenToActionTriggerEvents(onActionTriggerEventCallback: (actionTriggerEvent: ActionTriggerEvent) => void): void
}
