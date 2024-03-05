import { StatusMessage } from '../../../model/entities/status-message'

export interface StatusMessageEventEmitter {
  emitStatusMessageEvent(statusMessage: StatusMessage): void
}
