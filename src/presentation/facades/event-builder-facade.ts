import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { EventBuilder } from '../services/event-builder'
import { ActionTriggerEventBuilder } from '../interfaces/action-trigger-event-builder'
import {MediaEventBuilder} from '../interfaces/media-event-builder'

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
}
