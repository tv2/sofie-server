import { StatusMessage } from '../../domain/entities/status-message'

export interface StatusMessageEventEmitter {
  emitStatusMessageEvent(statusMessage: StatusMessage): void
}
