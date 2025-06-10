import { EventServer } from '../emitters/interfaces/event-server'
import { WebSocketEventServer } from '../emitters/web-socket-event-server'
import { EventEmitterFacade } from './event-emitter-facade'
import { LoggerFacade } from '../../cross-cutting-concerns/application/logger-facade'

export class EventServerFacade {
  public static createEventServer(): EventServer {
    return WebSocketEventServer.getInstance(
      EventEmitterFacade.createRundownEventObserver(),
      EventEmitterFacade.createActionEventObserver(),
      EventEmitterFacade.createTriggerEventObserver(),
      EventEmitterFacade.createMacroEventObserver(),
      EventEmitterFacade.createMediaEventObserver(),
      EventEmitterFacade.createConfigurationEventObserver(),
      EventEmitterFacade.createStatusMessageEventObserver(),
      EventEmitterFacade.createDeviceEventObserver(),
      EventEmitterFacade.createPlayoutContentEventObserver(),
      LoggerFacade.createLogger()
    )
  }
}
