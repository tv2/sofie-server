import { TypedEvent } from './typed-event'
import { ActionEventType } from '../enums/event-type'
import { ActionDto } from '../dtos/action-dto'

export type ActionEvent = ActionsUpdatedEvent

export interface ActionsUpdatedEvent extends TypedEvent {
  type: ActionEventType.ACTIONS_UPDATED,
  actions: ActionDto[]
  /**
   * If provided the Actions are for a specific Rundown.
   * If not provided, the Actions are "system" Actions.
   */
  rundownId?: string
}
