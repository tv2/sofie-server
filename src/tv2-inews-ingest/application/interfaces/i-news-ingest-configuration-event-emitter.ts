import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'

export interface INewsIngestConfigurationEventEmitter {
  emitINewsIngestConfigurationUpdated(iNewsIngestConfiguration: INewsIngestConfiguration): void
}
