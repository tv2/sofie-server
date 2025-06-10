import { StatusMessage } from '../../../rundown-execution/domain/entities/status-message'

export interface StatusMessageEventEmitter {
  emitStatusMessageEvent(statusMessage: StatusMessage): void
}
