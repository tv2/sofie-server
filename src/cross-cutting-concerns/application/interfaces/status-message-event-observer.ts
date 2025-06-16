import { StatusMessageEvent } from '../value-objects/status-message-event'

export interface StatusMessageEventObserver {
  subscribeToStatusMessageEvents(onStatusEventCallback: (statusMessageEvent: StatusMessageEvent) => void): void
}
