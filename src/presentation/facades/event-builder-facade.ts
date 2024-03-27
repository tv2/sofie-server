import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { EventBuilder } from '../services/event-builder'
import { ActionTriggerEventBuilder } from '../interfaces/action-trigger-event-builder'
import { MediaEventBuilder } from '../interfaces/media-event-builder'
import { ConfigurationEventBuilder } from '../interfaces/configuration-event-builder'
import { StatusMessageEventBuilder } from '../interfaces/status-message-event-builder'

export class EventBuilderFacade {

  public static createRundownEventBuilder(): RundownEventBuilder {
    return new EventBuilder()
  }

  public static createActionTriggerEventBuilder(): ActionTriggerEventBuilder {
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
}
