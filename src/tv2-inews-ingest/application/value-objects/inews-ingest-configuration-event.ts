import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { InewsIngestConfigurationEventType } from '../enum/inews-ingest-configuration-event-type'
import { InewsIngestConfigurationDto } from '../dtos/inews-ingest-configuration-dto'

export type InewsIngestConfigurationEvent = InewsIngestConfigurationUpdatedEvent

export interface InewsIngestConfigurationUpdatedEvent extends TypedEvent {
  type: InewsIngestConfigurationEventType.INEWS_INGEST_CONFIGURATION_UPDATED
  inewsIngestConfiguration: InewsIngestConfigurationDto
}
