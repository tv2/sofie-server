import { Action, ActionArgument } from '../../domain/entities/action'
import { ActionType } from '../../domain/enums/action-type'

export class ActionDto {

  public readonly id: string
  public readonly name: string
  public readonly rank: number
  public readonly description?: string
  public readonly type: ActionType
  public readonly metadata?: unknown
  public readonly argument?: ActionArgument
  public readonly rundownId?: string

  constructor(action: Action) {
    this.id = action.id
    this.name = action.name
    this.rank = action.rank
    this.description = action.description
    this.type = action.type
    this.metadata = action.metadata
    this.argument = action.argument
    this.rundownId = action.rundownId
  }
}
