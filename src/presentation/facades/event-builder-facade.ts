import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { EventBuilder } from '../services/event-builder'
import { TriggerEventBuilder } from '../../action-system/application/interfaces/trigger-event-builder'
import { MediaEventBuilder } from '../interfaces/media-event-builder'
import { ConfigurationEventBuilder } from '../interfaces/configuration-event-builder'
import { StatusMessageEventBuilder } from '../interfaces/status-message-event-builder'
import { ActionEventBuilder } from '../../action-system/application/interfaces/action-event-builder'
import { DeviceEventBuilder } from '../interfaces/device-event-builder'
import { MacroEventBuilder } from '../../action-system/application/interfaces/macro-event-builder'
import { PlayoutContentEventBuilder } from '../interfaces/playout-content-event-builder'

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
