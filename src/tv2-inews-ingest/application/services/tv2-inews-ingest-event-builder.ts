import { InewsIngestConfigurationEventBuilder } from '../interfaces/inews-ingest-configuration-event-builder'
import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'
import { InewsIngestConfigurationUpdatedEvent } from '../value-objects/inews-ingest-configuration-event'
import { InewsIngestConfigurationEventType } from '../enum/inews-ingest-configuration-event-type'
import { InewsIngestConfigurationDto } from '../dtos/inews-ingest-configuration-dto'

export class Tv2InewsIngestEventBuilder implements InewsIngestConfigurationEventBuilder {
  public buildInewsIngestConfigurationUpdatedEvent(inewsIngestConfiguration: InewsIngestConfiguration): InewsIngestConfigurationUpdatedEvent {
    return {
      type: InewsIngestConfigurationEventType.INEWS_INGEST_CONFIGURATION_UPDATED,
      timestamp: Date.now(),
      inewsIngestConfiguration: new InewsIngestConfigurationDto(inewsIngestConfiguration)
    }
  }
}
