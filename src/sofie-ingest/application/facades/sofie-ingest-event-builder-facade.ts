import {MediaEventBuilder} from '../interfaces/media-event-builder'
import {SofieIngestEventBuilder} from '../services/sofie-ingest-event-builder'

export class SofieIngestEventBuilderFacade {
  public static getMediaEventBuilder(): MediaEventBuilder {
    return new SofieIngestEventBuilder()
  }
}