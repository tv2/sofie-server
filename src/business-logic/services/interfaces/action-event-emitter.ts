import { Action } from '../../../rundown-execution/domain/entities/action'

export interface ActionEventEmitter {
  emitActionsUpdatedEvent(actions: Action[], rundownId?: string): void
}
