import { INewsIngestConfigurationEventBuilder } from '../interfaces/i-news-ingest-configuration-event-builder'
import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'
import { INewsIngestConfigurationUpdatedEvent } from '../value-objects/i-news-ingest-configuration-event'
import { INewsIngestConfigurationEventType } from '../enum/i-news-ingest-configuration-event-type'
import { INewsIngestConfigurationDto } from '../dtos/i-news-ingest-configuration-dto'

export class Tv2INewsIngestEventBuilder implements INewsIngestConfigurationEventBuilder {
  public buildINewsIngestConfigurationUpdatedEvent(iNewsIngestConfiguration: INewsIngestConfiguration): INewsIngestConfigurationUpdatedEvent {
    return {
      type: INewsIngestConfigurationEventType.I_NEWS_INGEST_CONFIGURATION_UPDATED,
      timestamp: Date.now(),
      iNewsIngestConfiguration: new INewsIngestConfigurationDto(iNewsIngestConfiguration)
    }
  }
}
