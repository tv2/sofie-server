import { ActionTrigger } from '../../../model/value-objects/action-trigger'

export interface ActionTriggerRepository {
  getActionTriggers(): Promise<ActionTrigger[]>
  saveActionTrigger(actionTrigger: ActionTrigger): Promise<void>
}
