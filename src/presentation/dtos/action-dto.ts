import { Action } from '../../model/entities/action'
import { ActionType } from '../../model/enums/action-type'

export class ActionDto {

  public readonly id: string
  public readonly name: string
  public readonly type: ActionType

  constructor(action: Action) {
    this.id = action.id
    this.name = action.name
    this.type = action.type
  }
}
