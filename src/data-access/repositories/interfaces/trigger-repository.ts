import { Trigger } from '../../../model/entities/trigger'

export interface TriggerRepository {
  getTriggers(): Promise<Trigger[]>
  createTrigger(trigger: Omit<Trigger, 'id'>): Promise<Trigger>
  updateTrigger(trigger: Trigger): Promise<Trigger>
  deleteTrigger(actionTriggerId: string): Promise<void>
}
