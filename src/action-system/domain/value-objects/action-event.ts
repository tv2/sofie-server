import { TypedEvent } from '../../../presentation/value-objects/typed-event'
import { ActionEventType } from '../../../presentation/enums/event-type'
import { ActionDto } from '../../application/dtos/action-dto'

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
