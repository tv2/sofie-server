import { Action } from '../../../model/entities/action'

export interface ActionRepository {
  getAction(actionId: string): Promise<Action>
  saveActions(actions: Action[]): Promise<void>
  deleteRundownActions(rundownId: string): Promise<void>
}
