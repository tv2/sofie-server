import {MediaEventEmitter} from '../../../rundown-execution/application/interfaces/media-event-emitter'
import {MediaEventService} from '../services/media-event-service'
import {SofieIngestEventBuilderFacade} from './sofie-ingest-event-builder-facade'
import {MediaEventObserver} from '../interfaces/media-event-observer'

export class SofieIngestEventEmitterFacade {

  public static getMediaEventEmitter(): MediaEventEmitter {
    return MediaEventService.getInstance(SofieIngestEventBuilderFacade.getMediaEventBuilder())
  }

  public static getMediaEventObserver(): MediaEventObserver {
    return MediaEventService.getInstance(SofieIngestEventBuilderFacade.getMediaEventBuilder())
  }
}