import {ActionEventBuilder} from '../interfaces/action-event-builder'
import {MacroEventBuilder} from '../interfaces/macro-event-builder'
import {TriggerEventBuilder} from '../interfaces/trigger-event-builder'
import {Action} from '../../domain/entities/action'
import {ActionsUpdatedEvent} from '../value-objects/action-event'
import {ActionEventType} from '../enums/action-event-type'
import {ActionDto} from '../dtos/action-dto'
import {Macro} from '../../domain/entities/macro'
import {MacroCreatedEvent, MacroDeletedEvent, MacroUpdatedEvent} from '../value-objects/macro-event'
import {MacroEventType} from '../enums/macro-event-type'
import {MacroDto} from '../dtos/macro-dto'
import {Trigger} from '../../domain/entities/trigger'
import {TriggerCreatedEvent, TriggerDeletedEvent, TriggerUpdatedEvent} from '../value-objects/trigger-event'
import {TriggerEventType} from '../enums/trigger-event-type'
import {TriggerDto} from '../dtos/trigger-dto'

export class ActionSystemEventBuilder implements ActionEventBuilder, MacroEventBuilder, TriggerEventBuilder {

  public buildActionsUpdatedEvent(actions: Action[], rundownId?: string): ActionsUpdatedEvent {
    return {
      type: ActionEventType.ACTIONS_UPDATED,
      timestamp: Date.now(),
      rundownId,
      actions: actions.map(action => new ActionDto(action))
    }
  }

  public buildMacroCreatedEvent(macro: Macro): MacroCreatedEvent {
    return {
      type: MacroEventType.MACRO_CREATED,
      timestamp: Date.now(),
      macro: new MacroDto(macro),
    }
  }

  public buildMacroDeletedEvent(macroId: string): MacroDeletedEvent {
    return {
      type: MacroEventType.MACRO_DELETED,
      timestamp: Date.now(),
      macroId,
    }
  }

  public buildMacroUpdatedEvent(macro: Macro): MacroUpdatedEvent {
    return {
      type: MacroEventType.MACRO_UPDATED,
      timestamp: Date.now(),
      macro: new MacroDto(macro),
    }
  }

  public buildTriggerCreatedEvent(trigger: Trigger): TriggerCreatedEvent {
    return {
      type: TriggerEventType.TRIGGER_CREATED,
      timestamp: Date.now(),
      trigger: TriggerDto.createTriggerDto(trigger)
    }
  }

  public buildTriggerUpdatedEvent(trigger: Trigger): TriggerUpdatedEvent {
    return {
      type: TriggerEventType.TRIGGER_UPDATED,
      timestamp: Date.now(),
      trigger: TriggerDto.createTriggerDto(trigger)
    }
  }

  public buildTriggerDeletedEvent(triggerId: string): TriggerDeletedEvent {
    return {
      type: TriggerEventType.TRIGGER_DELETED,
      timestamp: Date.now(),
      triggerId: triggerId,
    }
  }
}