import { Action } from '../../domain/entities/action'
import { ActionsUpdatedEvent } from '../value-objects/action-event'

export interface ActionEventBuilder {
  buildActionsUpdatedEvent(actions: Action[], rundownId?: string): ActionsUpdatedEvent
}
