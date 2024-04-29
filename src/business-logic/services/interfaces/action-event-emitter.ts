import { Action } from '../../../model/entities/action'

export interface ActionEventEmitter {
  emitActionsUpdatedEvent(actions: Action[], rundownId?: string): void
}
