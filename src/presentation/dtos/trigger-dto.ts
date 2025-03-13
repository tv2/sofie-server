import { ActionTrigger, MacroTrigger, Trigger, TriggerType } from '../../model/entities/trigger'
import { UnexpectedCaseException } from '../../model/exceptions/unexpected-case-exception'

export abstract class TriggerDto {
  public id: string
  public type: TriggerType
  public data: unknown

  public static createTriggerDto(trigger: Trigger): TriggerDto {
    switch (trigger.type) {
      case TriggerType.ACTION:
        return new ActionTriggerDto(trigger)
      case TriggerType.MACRO:
        return new MacroTriggerDto(trigger)
    }
  }

  public static toEntity(triggerDto: TriggerDto): Trigger {
    switch (triggerDto.type) {
      case TriggerType.ACTION: {
        return ActionTriggerDto.toEntity(triggerDto as ActionTriggerDto)
      }
      case TriggerType.MACRO: {
        return MacroTriggerDto.toEntity(triggerDto as MacroTriggerDto)
      }
      default:
        throw new UnexpectedCaseException(triggerDto.type,'Unexpected Trigger type.')
    }
  }
}

export class ActionTriggerDto extends TriggerDto {
  public readonly actionId: string
  public readonly actionArguments?: string | number

  constructor(trigger: ActionTrigger) {
    super()
    this.id = trigger.id
    this.type = trigger.type
    this.actionId = trigger.actionId
    this.data = trigger.data
    this.actionArguments = trigger.actionArguments
  }

  public static toEntity(actionTriggerDto: ActionTriggerDto): ActionTrigger {
    return {
      id: actionTriggerDto.id,
      type: TriggerType.ACTION,
      actionId: actionTriggerDto.actionId,
      actionArguments: actionTriggerDto.actionArguments,
      data: actionTriggerDto.data
    }
  }
}

export class MacroTriggerDto extends TriggerDto {
  public readonly macroId: string

  constructor(trigger: MacroTrigger) {
    super()
    this.id = trigger.id
    this.type = trigger.type
    this.macroId = trigger.macroId
    this.data = trigger.data
  }

  public static toEntity(macroTriggerDto: MacroTriggerDto): MacroTrigger {
    return {
      id: macroTriggerDto.id,
      type: TriggerType.MACRO,
      macroId: macroTriggerDto.macroId,
      data: macroTriggerDto.data
    }
  }
}
