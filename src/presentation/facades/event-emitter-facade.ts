import { RundownEventObserver } from '../interfaces/rundown-event-observer'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownEventEmitter } from '../../business-logic/services/interfaces/rundown-event-emitter'
import { EventBuilderFacade } from './event-builder-facade'
import { ActionTriggerEventEmitter } from '../../business-logic/services/interfaces/action-trigger-event-emitter'
import { ActionTriggerEventService } from '../services/action-trigger-event-service'
import { ActionTriggerEventObserver } from '../interfaces/action-trigger-event-observer'
import { MediaEventEmitter } from '../../business-logic/services/interfaces/media-event-emitter'
import { MediaEventService } from '../services/media-event-service'
import { MediaEventObserver } from '../interfaces/media-event-observer'
import { ConfigurationEventEmitter } from '../../business-logic/services/interfaces/configuration-event-emitter'
import { ConfigurationEventService } from '../services/configuration-event-service'
import { ConfigurationEventObserver } from '../interfaces/configuration-event-observer'
import { StatusMessageEventObserver } from '../interfaces/status-message-event-observer'
import { StatusMessageEventService } from '../services/status-message-event-service'
import { StatusMessageEventEmitter } from '../../business-logic/services/interfaces/status-message-event-emitter'

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

  public static createMediaEventEmitter(): MediaEventEmitter {
    return MediaEventService.getInstance(EventBuilderFacade.createMediaEventBuilder())
  }

  public static createMediaEventObserver(): MediaEventObserver {
    return MediaEventService.getInstance(EventBuilderFacade.createMediaEventBuilder())
  }

  public static createConfigurationEventEmitter(): ConfigurationEventEmitter {
    return ConfigurationEventService.getInstance(EventBuilderFacade.createConfigurationEventBuilder())
  }

  public static createConfigurationEventObserver(): ConfigurationEventObserver {
    return ConfigurationEventService.getInstance(EventBuilderFacade.createConfigurationEventBuilder())
  }

  public static createStatusMessageEventEmitter(): StatusMessageEventEmitter {
    return StatusMessageEventService.getInstance(EventBuilderFacade.createStatusMessageEventBuilder())
  }

  public static createStatusMessageEventObserver(): StatusMessageEventObserver {
    return StatusMessageEventService.getInstance(EventBuilderFacade.createStatusMessageEventBuilder())
  }
}
