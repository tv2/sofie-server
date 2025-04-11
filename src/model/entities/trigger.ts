export type Trigger = ActionTrigger | MacroTrigger

interface BaseTrigger {
  id: string
  type: TriggerType
  data: unknown // Defined by whatever frontend that needs to have a Trigger
}

export interface ActionTrigger extends BaseTrigger {
  type: TriggerType.ACTION
  actionId: string
  actionArguments?: string | number
}

export interface MacroTrigger extends BaseTrigger {
  type: TriggerType.MACRO
  macroId: string
}

export enum TriggerType {
  ACTION = 'ACTION',
  MACRO = 'MACRO'
}
