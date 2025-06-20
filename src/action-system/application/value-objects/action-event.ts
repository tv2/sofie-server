import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { ActionDto } from '../dtos/action-dto'
import { ActionEventType } from '../enums/action-event-type'

export type ActionEvent = ActionsUpdatedEvent

export interface ActionsUpdatedEvent extends TypedEvent {
  type: ActionEventType.ACTIONS_UPDATED
  actions: ActionDto[]
  /**
   * If provided the Actions are for a specific Rundown.
   * If not provided, the Actions are "system" Actions.
   */
  rundownId?: string
}
