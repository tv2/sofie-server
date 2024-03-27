import { Action } from '../../../model/entities/action'

export interface ActionService {
  getActions(): Promise<Action[]>
  getActionsForRundown(rundownId: string): Promise<Action[]>
  executeAction(actionId: string, rundownId: string, actionArguments: unknown): Promise<void>
}
