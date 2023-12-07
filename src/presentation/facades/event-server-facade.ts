import { EventServer } from '../emitters/interfaces/event-server'
import { WebSocketEventServer } from '../emitters/web-socket-event-server'
import { EventEmitterFacade } from './event-emitter-facade'
import { LoggerFacade } from '../../logger-facade'

export class EventServerFacade {
  public static createEventServer(): EventServer {
    return WebSocketEventServer.getInstance(
      EventEmitterFacade.createRundownEventObserver(),
      EventEmitterFacade.createActionTriggerEventObserver(),
      LoggerFacade.createLogger()
    )
  }
}
