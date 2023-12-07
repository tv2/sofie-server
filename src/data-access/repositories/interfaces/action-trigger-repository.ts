import { ActionTrigger } from '../../../model/entities/action-trigger'

export interface ActionTriggerRepository {
  getActionTriggers(): Promise<ActionTrigger[]>
  createActionTrigger(actionTrigger: Omit<ActionTrigger, 'id'>): Promise<ActionTrigger>
  updateActionTrigger(actionTrigger: ActionTrigger): Promise<ActionTrigger>
  deleteActionTrigger(actionTriggerId: string): Promise<void>
}
