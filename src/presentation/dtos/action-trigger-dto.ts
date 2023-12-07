import { ActionTrigger } from '../../model/entities/action-trigger'

export class ActionTriggerDto {
  public readonly id: string
  public readonly actionId: string
  public readonly data: unknown

  constructor(actionTrigger: ActionTrigger) {
    this.id = actionTrigger.id
    this.actionId = actionTrigger.actionId
    this.data = actionTrigger.data
  }
}
