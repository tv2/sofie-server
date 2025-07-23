import { ActionEvent } from '../value-objects/action-event'

export interface ActionEventObserver {
  subscribeToActionEvents(onActionEventCallback: (actionEvent: ActionEvent) => void): void
}
