import { Trigger } from '../../domain/entities/trigger'

export interface TriggerService {
  getTriggers(): Promise<Trigger[]>
  createTrigger(trigger: Trigger): Promise<void>
  updateTrigger(trigger: Trigger): Promise<void>
  deleteTrigger(triggerId: string): Promise<void>
}
