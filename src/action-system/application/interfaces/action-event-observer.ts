import { ActionEvent } from '../../domain/value-objects/action-event'

export interface ActionEventObserver {
  subscribeToActionEvents(onActionEventCallback: (actionEvent: ActionEvent) => void): void
}
