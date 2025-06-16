import { RundownEventBuilder } from '../rundown-execution/application/interfaces/rundown-event-builder'
import { EventBuilder } from './event-builder'
import { TriggerEventBuilder } from '../action-system/application/interfaces/trigger-event-builder'
import { MediaEventBuilder } from '../sofie-ingest/application/interfaces/media-event-builder'
import { ConfigurationEventBuilder } from '../rundown-execution/application/interfaces/configuration-event-builder'
import { StatusMessageEventBuilder } from '../cross-cutting-concerns/application/interfaces/status-message-event-builder'
import { ActionEventBuilder } from '../action-system/application/interfaces/action-event-builder'
import { DeviceEventBuilder } from '../rundown-execution/application/interfaces/device-event-builder'
import { MacroEventBuilder } from '../action-system/application/interfaces/macro-event-builder'
import { PlayoutContentEventBuilder } from '../rundown-execution/application/interfaces/playout-content-event-builder'

export class EventBuilderFacade {

  public static createRundownEventBuilder(): RundownEventBuilder {
    return new EventBuilder()
  }

  public static createActionEventBuilder(): ActionEventBuilder {
    return new EventBuilder()
  }

  public static createTriggerEventBuilder(): TriggerEventBuilder {
    return new EventBuilder()
  }

  public static createMacroEventBuilder(): MacroEventBuilder {
    return new EventBuilder()
  }

  public static createMediaEventBuilder(): MediaEventBuilder {
    return new EventBuilder()
  }

  public static createConfigurationEventBuilder(): ConfigurationEventBuilder {
    return new EventBuilder()
  }

  public static createStatusMessageEventBuilder(): StatusMessageEventBuilder {
    return new EventBuilder()
  }

  public static createDeviceEventBuilder(): DeviceEventBuilder {
    return new EventBuilder()
  }

  public static createPlayoutContentEventBuilder(): PlayoutContentEventBuilder {
    return new EventBuilder()
  }
}
