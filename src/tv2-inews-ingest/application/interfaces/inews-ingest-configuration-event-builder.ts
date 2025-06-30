import { InewsIngestConfigurationUpdatedEvent } from '../value-objects/inews-ingest-configuration-event'
import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'

export interface InewsIngestConfigurationEventBuilder {
  buildInewsIngestConfigurationUpdatedEvent(inewsIngestConfiguration: InewsIngestConfiguration): InewsIngestConfigurationUpdatedEvent
}
