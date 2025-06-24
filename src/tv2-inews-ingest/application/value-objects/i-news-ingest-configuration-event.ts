import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { INewsIngestConfigurationEventType } from '../enum/i-news-ingest-configuration-event-type'
import { INewsIngestConfigurationDto } from '../dtos/i-news-ingest-configuration-dto'

export type INewsIngestConfigurationEvent = INewsIngestConfigurationUpdatedEvent

export interface INewsIngestConfigurationUpdatedEvent extends TypedEvent {
  type: INewsIngestConfigurationEventType.I_NEWS_INGEST_CONFIGURATION_UPDATED
  iNewsIngestConfiguration: INewsIngestConfigurationDto
}
