import {ActionTrigger, MacroTrigger, TriggerType} from '../../model/entities/trigger'

export type TriggerDto = ActionTriggerDto | MacroTriggerDto

abstract class BaseTriggerDto {
  public id: string
  public type: TriggerType
  public data: unknown
}

export class ActionTriggerDto extends BaseTriggerDto {
  public readonly actionId: string
  public readonly actionArguments: string | number

  constructor(trigger: ActionTrigger) {
    super()
    this.id = trigger.id
    this.type = trigger.type
    this.actionId = trigger.actionId
    this.data = trigger.data
    this.actionArguments = trigger.actionArguments
  }
}

export class MacroTriggerDto extends BaseTriggerDto {
  public readonly macroId: string

  constructor(trigger: MacroTrigger) {
    super()
    this.id = trigger.id
    this.macroId = trigger.macroId
    this.data = trigger.data
  }
}
