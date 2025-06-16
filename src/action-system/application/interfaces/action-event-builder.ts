import { Action } from '../../domain/entities/action'
import { ActionsUpdatedEvent } from '../../domain/value-objects/action-event'

export interface ActionEventBuilder {
  buildActionsUpdatedEvent(actions: Action[], rundownId?: string): ActionsUpdatedEvent
}
