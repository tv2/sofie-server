import { EventServer } from '../emitters/interfaces/event-server'
import { WebSocketEventServer } from '../emitters/web-socket-event-server'
import { EventEmitterFacade } from './event-emitter-facade'
import { ConsoleLogger } from '../../console-logger'

export class EventServerFacade {
  public static createEventServer(): EventServer {
    return WebSocketEventServer.getInstance(
      EventEmitterFacade.createRundownEventObserver(),
      EventEmitterFacade.createActionTriggerEventObserver(),
      ConsoleLogger.getInstance()
    )
  }
}
