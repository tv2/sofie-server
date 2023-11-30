import { RundownEventServer } from '../emitters/interfaces/rundown-event-server'
import { RundownWebSocketEventServer } from '../emitters/rundown-web-socket-event-server'
import { EventEmitterFacade } from './event-emitter-facade'
import { LoggerService } from '../../model/services/logger-service'

export class RundownEventServerFacade {
  public static createRundownEventServer(): RundownEventServer {
    return RundownWebSocketEventServer.getInstance(EventEmitterFacade.createRundownEventListener(), new LoggerService())
  }
}
