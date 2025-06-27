import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'

export interface IngestService {
  getIngestConfiguration(): Promise<InewsIngestConfiguration>
  saveIngestConfiguration(inewsIngestConfiguration: InewsIngestConfiguration): Promise<void>
}
