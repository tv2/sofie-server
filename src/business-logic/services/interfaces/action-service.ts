import { Action } from '../../../model/entities/action'

export interface ActionService {
  getActionsForRundown(rundownId: string): Promise<Action[]>
  getSystemActions(): Promise<Action[]>
  executeAction(actionId: string, rundownId: string, actionArguments: unknown): Promise<void>
}
