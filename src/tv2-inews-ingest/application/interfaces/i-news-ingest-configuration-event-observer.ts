import { INewsIngestConfigurationEvent } from '../value-objects/i-news-ingest-configuration-event'

export interface INewsIngestConfigurationEventObserver {
  subscribeToINewsIngestConfigurationEvents(onINewsIngestConfigurationEventCallback: (iNewsIngestConfigurationEvent: INewsIngestConfigurationEvent) => void): void
}
