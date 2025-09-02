import { Action, ActionArgument } from '../../../domain/entities/action'
import { MongoId } from '../../../../cross-cutting-concerns/infrastructure/value-objects/mongo-id'
import { ActionType } from '../../../domain/enums/action-type'

export interface MongoAction extends MongoId {
  id: string
  name: string
  rank: number
  description?: string
  type: ActionType
  data: unknown
  metadata?: unknown
  rundownId?: string
  argument?: ActionArgument
}

export class ActionSystemMongoEntityConverter {
  public convertToAction(mongoAction: MongoAction): Action {
    return {
      id: mongoAction.id,
      type: mongoAction.type,
      rundownId: mongoAction.rundownId ?? undefined,
      argument: mongoAction.argument,
      data: mongoAction.data,
      description: mongoAction.description,
      metadata: mongoAction.metadata,
      name: mongoAction.name,
      rank: mongoAction.rank,
    }
  }

  public convertToMongoAction(action: Action): MongoAction {
    return {
      ...action,
      _id: action.id
    }
  }
}
