import {ActionEventBuilder} from '../interfaces/action-event-builder'
import {ActionSystemEventBuilder} from '../services/action-system-event-builder'
import {MacroEventBuilder} from '../interfaces/macro-event-builder'
import {TriggerEventBuilder} from '../interfaces/trigger-event-builder'

export class ActionSystemEventBuilderFacade {

  public static getActionEventBuilder(): ActionEventBuilder {
    return new ActionSystemEventBuilder()
  }

  public static getTriggerEventBuilder(): TriggerEventBuilder {
    return new ActionSystemEventBuilder()
  }
  
  public static getMacroEventBuilder(): MacroEventBuilder {
    return new ActionSystemEventBuilder()
  }
}