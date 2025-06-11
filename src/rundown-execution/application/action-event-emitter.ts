import { Action } from '../domain/entities/action'

export interface ActionEventEmitter {
  emitActionsUpdatedEvent(actions: Action[], rundownId?: string): void
}
