import { Action } from '../../../model/entities/action'

export interface ActionRepository {
  getAction(actionId: string): Promise<Action>
  getActions(): Promise<Action[]>
  getActionsForRundown(rundownId: string): Promise<Action[]>
  saveActions(actions: Action[]): Promise<void>
  deleteActionsNotOnRundowns(): Promise<void>
  deleteActionsForRundown(rundownId: string): Promise<void>
}
