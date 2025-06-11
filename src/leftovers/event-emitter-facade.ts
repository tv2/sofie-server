import { RundownEventObserver } from '../rundown-execution/application/interfaces/rundown-event-observer'
import { RundownEventService } from '../rundown-execution/application/services/rundown-event-service'
import { RundownEventEmitter } from '../rundown-execution/application/interfaces/rundown-event-emitter'
import { TriggerEventEmitter } from '../action-system/application/interfaces/trigger-event-emitter'
import { TriggerEventService } from '../action-system/application/services/trigger-event-service'
import { TriggerEventObserver } from '../action-system/application/interfaces/trigger-event-observer'
import { MediaEventEmitter } from '../rundown-execution/application/interfaces/media-event-emitter'
import { MediaEventService } from '../sofie-ingest/application/services/media-event-service'
import { MediaEventObserver } from '../sofie-ingest/application/interfaces/media-event-observer'
import { ConfigurationEventEmitter } from '../rundown-execution/application/interfaces/configuration-event-emitter'
import { ConfigurationEventService } from '../rundown-execution/application/services/configuration-event-service'
import { ConfigurationEventObserver } from '../rundown-execution/application/interfaces/configuration-event-observer'
import { StatusMessageEventObserver } from '../cross-cutting-concerns/application/interfaces/status-message-event-observer'
import { StatusMessageEventService } from '../cross-cutting-concerns/application/services/status-message-event-service'
import { StatusMessageEventEmitter } from '../cross-cutting-concerns/application/interfaces/status-message-event-emitter'
import { ActionEventObserver } from '../action-system/application/interfaces/action-event-observer'
import { ActionEventService } from '../action-system/application/services/action-event-service'
import { ActionEventEmitter } from '../action-system/application/interfaces/action-event-emitter'
import { DeviceEventEmitter } from '../rundown-execution/application/interfaces/device-event-emitter'
import { DeviceEventService } from '../rundown-execution/application/services/device-event-service'
import { DeviceEventObserver } from '../rundown-execution/application/interfaces/device-event-observer'
import { MacroEventObserver } from '../action-system/application/interfaces/macro-event-observer'
import { MacroEventEmitter } from '../action-system/application/interfaces/macro-event-emitter'
import { MacroEventService } from '../action-system/application/services/macro-event-service'
import { PlayoutContentEventObserver } from '../rundown-execution/application/interfaces/playout-content-event-observer'
import { PlayoutContentEventService } from '../rundown-execution/application/services/playout-content-event-service'
import { PlayoutContentEventEmitter } from '../rundown-execution/application/interfaces/playout-content-event-emitter'
import {
  RundownExecutionEventBuilderFacade
} from '../rundown-execution/application/facades/rundown-execution-event-builder-facade'
import {ActionSystemEventBuilderFacade} from '../action-system/application/facades/action-system-event-builder-facade'
import {SofieIngestEventBuilderFacade} from '../sofie-ingest/application/facades/sofie-ingest-event-builder-facade'
import {
  CrossCuttingConcernsEventBuilderFacade
} from '../cross-cutting-concerns/application/facades/cross-cutting-concerns-event-builder-facade'

export class EventEmitterFacade {

  public static createRundownEventEmitter(): RundownEventEmitter {
    return RundownEventService.getInstance(RundownExecutionEventBuilderFacade.getRundownEventBuilder())
  }

  public static createRundownEventObserver(): RundownEventObserver {
    return RundownEventService.getInstance(RundownExecutionEventBuilderFacade.getRundownEventBuilder())
  }

  public static createTriggerEventEmitter(): TriggerEventEmitter {
    return TriggerEventService.getInstance(ActionSystemEventBuilderFacade.getTriggerEventBuilder())
  }

  public static createMacroEventEmitter(): MacroEventEmitter {
    return MacroEventService.getInstance(ActionSystemEventBuilderFacade.getMacroEventBuilder())
  }

  public static createActionEventEmitter(): ActionEventEmitter {
    return ActionEventService.getInstance(ActionSystemEventBuilderFacade.getActionEventBuilder())
  }

  public static createActionEventObserver(): ActionEventObserver {
    return ActionEventService.getInstance(ActionSystemEventBuilderFacade.getActionEventBuilder())
  }

  public static createTriggerEventObserver(): TriggerEventObserver {
    return TriggerEventService.getInstance(ActionSystemEventBuilderFacade.getTriggerEventBuilder())
  }

  public static createMacroEventObserver(): MacroEventObserver {
    return MacroEventService.getInstance(ActionSystemEventBuilderFacade.getMacroEventBuilder())
  }

  public static createMediaEventEmitter(): MediaEventEmitter {
    return MediaEventService.getInstance(SofieIngestEventBuilderFacade.getMediaEventBuilder())
  }

  public static createMediaEventObserver(): MediaEventObserver {
    return MediaEventService.getInstance(SofieIngestEventBuilderFacade.getMediaEventBuilder())
  }

  public static createConfigurationEventEmitter(): ConfigurationEventEmitter {
    return ConfigurationEventService.getInstance(RundownExecutionEventBuilderFacade.getConfigurationEventBuilder())
  }

  public static createConfigurationEventObserver(): ConfigurationEventObserver {
    return ConfigurationEventService.getInstance(RundownExecutionEventBuilderFacade.getConfigurationEventBuilder())
  }

  public static createStatusMessageEventEmitter(): StatusMessageEventEmitter {
    return StatusMessageEventService.getInstance(CrossCuttingConcernsEventBuilderFacade.getStatusMessageEventBuilder())
  }

  public static createStatusMessageEventObserver(): StatusMessageEventObserver {
    return StatusMessageEventService.getInstance(CrossCuttingConcernsEventBuilderFacade.getStatusMessageEventBuilder())
  }

  public static createDeviceEventEmitter(): DeviceEventEmitter {
    return DeviceEventService.getInstance(RundownExecutionEventBuilderFacade.getDeviceEventBuilder())
  }

  public static createDeviceEventObserver(): DeviceEventObserver {
    return DeviceEventService.getInstance(RundownExecutionEventBuilderFacade.getDeviceEventBuilder())
  }

  public static createPlayoutContentEventEmitter(): PlayoutContentEventEmitter {
    return PlayoutContentEventService.getInstance(RundownExecutionEventBuilderFacade.getPlayoutContentEventBuilder())
  }

  public static createPlayoutContentEventObserver(): PlayoutContentEventObserver {
    return PlayoutContentEventService.getInstance(RundownExecutionEventBuilderFacade.getPlayoutContentEventBuilder())
  }
}
