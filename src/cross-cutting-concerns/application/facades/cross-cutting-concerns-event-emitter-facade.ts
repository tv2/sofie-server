import {StatusMessageEventEmitter} from '../interfaces/status-message-event-emitter'
import {StatusMessageEventService} from '../services/status-message-event-service'
import {CrossCuttingConcernsEventBuilderFacade} from './cross-cutting-concerns-event-builder-facade'
import {StatusMessageEventObserver} from '../interfaces/status-message-event-observer'

export class CrossCuttingConcernsEventEmitterFacade {

  public static getStatusMessageEventEmitter(): StatusMessageEventEmitter {
    return StatusMessageEventService.getInstance(CrossCuttingConcernsEventBuilderFacade.getStatusMessageEventBuilder())
  }

  public static getStatusMessageEventObserver(): StatusMessageEventObserver {
    return StatusMessageEventService.getInstance(CrossCuttingConcernsEventBuilderFacade.getStatusMessageEventBuilder())
  }
}