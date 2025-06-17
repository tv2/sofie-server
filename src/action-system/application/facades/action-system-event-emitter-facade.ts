import {TriggerEventEmitter} from '../interfaces/trigger-event-emitter'
import {TriggerEventService} from '../services/trigger-event-service'
import {ActionSystemEventBuilderFacade} from './action-system-event-builder-facade'
import {MacroEventEmitter} from '../interfaces/macro-event-emitter'
import {MacroEventService} from '../services/macro-event-service'
import {ActionEventEmitter} from '../interfaces/action-event-emitter'
import {ActionEventService} from '../services/action-event-service'
import {ActionEventObserver} from '../interfaces/action-event-observer'
import {TriggerEventObserver} from '../interfaces/trigger-event-observer'
import {MacroEventObserver} from '../interfaces/macro-event-observer'

export class ActionSystemEventEmitterFacade {

  public static getTriggerEventEmitter(): TriggerEventEmitter {
    return TriggerEventService.getInstance(ActionSystemEventBuilderFacade.getTriggerEventBuilder())
  }

  public static getMacroEventEmitter(): MacroEventEmitter {
    return MacroEventService.getInstance(ActionSystemEventBuilderFacade.getMacroEventBuilder())
  }

  public static getActionEventEmitter(): ActionEventEmitter {
    return ActionEventService.getInstance(ActionSystemEventBuilderFacade.getActionEventBuilder())
  }

  public static getActionEventObserver(): ActionEventObserver {
    return ActionEventService.getInstance(ActionSystemEventBuilderFacade.getActionEventBuilder())
  }

  public static getTriggerEventObserver(): TriggerEventObserver {
    return TriggerEventService.getInstance(ActionSystemEventBuilderFacade.getTriggerEventBuilder())
  }

  public static getMacroEventObserver(): MacroEventObserver {
    return MacroEventService.getInstance(ActionSystemEventBuilderFacade.getMacroEventBuilder())
  }
}