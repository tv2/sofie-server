import { RundownEventListener } from '../interfaces/rundown-event-listener'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownEventEmitter } from '../../business-logic/services/interfaces/rundown-event-emitter'
import { EventBuilderFacade } from './event-builder-facade'
import { ActionTriggerEventEmitter } from '../../business-logic/services/interfaces/action-trigger-event-emitter'
import { ActionTriggerEventService } from '../services/action-trigger-event-service'
import { ActionTriggerEventListener } from '../interfaces/action-trigger-event-listener'

export class EventEmitterFacade {

  public static createRundownEventEmitter(): RundownEventEmitter {
    return RundownEventService.getInstance(EventBuilderFacade.createRundownEventBuilder())
  }

  public static createRundownEventListener(): RundownEventListener {
    return RundownEventService.getInstance(EventBuilderFacade.createRundownEventBuilder())
  }

  public static createActionTriggerEventEmitter(): ActionTriggerEventEmitter {
    return ActionTriggerEventService.getInstance(EventBuilderFacade.createActionTriggerEventBuilder())
  }

  public static createActionTriggerEventListener(): ActionTriggerEventListener {
    return ActionTriggerEventService.getInstance(EventBuilderFacade.createActionTriggerEventBuilder())
  }
}
