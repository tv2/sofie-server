import { ActionTrigger } from '../../../model/entities/action-trigger'

export interface ActionTriggerService {
  getActionTriggers(): Promise<ActionTrigger[]>
  createActionTrigger(actionTrigger: ActionTrigger): Promise<void>
  updateActionTrigger(actionTrigger: ActionTrigger): Promise<void>
  deleteActionTrigger(actionTriggerId: string): Promise<void>
}
