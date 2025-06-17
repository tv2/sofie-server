import { EventServer } from '../../infrastructure/interfaces/event-server'
import { WebSocketEventServer } from './web-socket-event-server'
import { LoggerFacade } from '../logger-facade'
import {ActionSystemEventEmitterFacade} from '../../../action-system/application/facades/action-system-event-emitter-facade'
import {
  CrossCuttingConcernsEventEmitterFacade
} from '../facades/cross-cutting-concerns-event-emitter-facade'
import {
  RundownExecutionEventEmitterFacade
} from '../../../rundown-execution/application/facades/rundown-execution-event-emitter-facade'
import {SofieIngestEventEmitterFacade} from '../../../sofie-ingest/application/facades/sofie-ingest-event-emitter-facade'

export class EventServerFacade {
  public static createEventServer(): EventServer {
    return WebSocketEventServer.getInstance(
      RundownExecutionEventEmitterFacade.getRundownEventObserver(),
      ActionSystemEventEmitterFacade.getActionEventObserver(),
      ActionSystemEventEmitterFacade.getTriggerEventObserver(),
      ActionSystemEventEmitterFacade.getMacroEventObserver(),
      SofieIngestEventEmitterFacade.getMediaEventObserver(),
      RundownExecutionEventEmitterFacade.getConfigurationEventObserver(),
      CrossCuttingConcernsEventEmitterFacade.getStatusMessageEventObserver(),
      RundownExecutionEventEmitterFacade.getDeviceEventObserver(),
      RundownExecutionEventEmitterFacade.getPlayoutContentEventObserver(),
      LoggerFacade.createLogger()
    )
  }
}
