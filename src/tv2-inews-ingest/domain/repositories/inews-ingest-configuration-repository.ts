import { InewsIngestConfiguration } from '../entities/inews-ingest-configuration'

export interface InewsIngestConfigurationRepository {
  get(): Promise<InewsIngestConfiguration>
  save(inewsIngestConfiguration: InewsIngestConfiguration): Promise<void>
}
