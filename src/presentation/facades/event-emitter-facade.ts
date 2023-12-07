import { RundownEventObserver } from '../interfaces/rundown-event-observer'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownEventEmitter } from '../../business-logic/services/interfaces/rundown-event-emitter'
import { EventBuilderFacade } from './event-builder-facade'
import { ActionTriggerEventEmitter } from '../../business-logic/services/interfaces/action-trigger-event-emitter'
import { ActionTriggerEventService } from '../services/action-trigger-event-service'
import { ActionTriggerEventObserver } from '../interfaces/action-trigger-event-observer'

export class EventEmitterFacade {

  public static createRundownEventEmitter(): RundownEventEmitter {
    return RundownEventService.getInstance(EventBuilderFacade.createRundownEventBuilder())
  }

  public static createRundownEventObserver(): RundownEventObserver {
    return RundownEventService.getInstance(EventBuilderFacade.createRundownEventBuilder())
  }

  public static createActionTriggerEventEmitter(): ActionTriggerEventEmitter {
    return ActionTriggerEventService.getInstance(EventBuilderFacade.createActionTriggerEventBuilder())
  }

  public static createActionTriggerEventObserver(): ActionTriggerEventObserver {
    return ActionTriggerEventService.getInstance(EventBuilderFacade.createActionTriggerEventBuilder())
  }
}
