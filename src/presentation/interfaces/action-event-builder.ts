import { Action } from '../../model/entities/action'
import { ActionsUpdatedEvent } from '../value-objects/action-event'

export interface ActionEventBuilder {
  buildActionsUpdatedEvent(actions: Action[], rundownId?: string): ActionsUpdatedEvent
}
