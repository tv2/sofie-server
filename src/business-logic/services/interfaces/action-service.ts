import { Action } from '../../../model/entities/action'

export interface ActionService {
  getActions(): Promise<Action[]>
  executeAction(actionId: string, rundownId: string, actionArguments: unknown): Promise<void>
}
