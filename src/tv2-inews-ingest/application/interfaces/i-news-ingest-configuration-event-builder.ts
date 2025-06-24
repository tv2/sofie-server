import { INewsIngestConfigurationUpdatedEvent } from '../value-objects/i-news-ingest-configuration-event'
import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'

export interface INewsIngestConfigurationEventBuilder {
  buildINewsIngestConfigurationUpdatedEvent(iNewsIngestConfiguration: INewsIngestConfiguration): INewsIngestConfigurationUpdatedEvent
}
