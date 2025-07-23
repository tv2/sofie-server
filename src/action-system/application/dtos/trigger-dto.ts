import { ActionTrigger, MacroTrigger, Trigger, TriggerType } from '../../domain/entities/trigger'
import { UnexpectedCaseException } from '../../../cross-cutting-concerns/domain/exceptions/unexpected-case-exception'

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
        throw new UnexpectedCaseException(triggerDto.type, 'Unexpected Trigger type.')
    }
  }
}

export class ActionTriggerDto extends TriggerDto {
  public readonly actionId: string
  public readonly actionArguments?: string | number

  public constructor(trigger: ActionTrigger) {
    super()
    this.id = trigger.id
    this.type = trigger.type
    this.actionId = trigger.actionId
    this.data = trigger.data
    this.actionArguments = trigger.actionArguments
  }

  public static toEntity(actionTriggerDto: ActionTriggerDto): ActionTrigger {
    const actionTrigger: ActionTrigger = {
      id: actionTriggerDto.id,
      type: TriggerType.ACTION,
      actionId: actionTriggerDto.actionId,
      data: actionTriggerDto.data
    }

    if (actionTriggerDto.actionArguments) {
      actionTrigger.actionArguments = actionTriggerDto.actionArguments
    }
    return actionTrigger
  }
}

export class MacroTriggerDto extends TriggerDto {
  public readonly macroId: string

  public constructor(trigger: MacroTrigger) {
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
