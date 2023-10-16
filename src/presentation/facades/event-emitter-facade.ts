import { RundownEventListener } from '../interfaces/rundown-event-listener'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownEventEmitter } from '../../business-logic/services/interfaces/rundown-event-emitter'

export class EventEmitterFacade {
  public static createRundownEventEmitter(): RundownEventEmitter {
    return RundownEventService.getInstance()
  }

  public static createRundownEventListener(): RundownEventListener {
    return RundownEventService.getInstance()
  }
}
