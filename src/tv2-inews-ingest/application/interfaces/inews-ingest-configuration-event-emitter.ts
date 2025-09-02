import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'

export interface InewsIngestConfigurationEventEmitter {
  emitInewsIngestConfigurationUpdated(inewsIngestConfiguration: InewsIngestConfiguration): void
}
