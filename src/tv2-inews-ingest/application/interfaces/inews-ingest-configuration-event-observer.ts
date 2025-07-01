import { InewsIngestConfigurationEvent } from '../value-objects/inews-ingest-configuration-event'

export interface InewsIngestConfigurationEventObserver {
  subscribeToInewsIngestConfigurationEvents(onInewsIngestConfigurationEventCallback: (inewsIngestConfigurationEvent: InewsIngestConfigurationEvent) => void): void
}
