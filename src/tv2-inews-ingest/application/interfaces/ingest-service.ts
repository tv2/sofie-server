import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'

export interface IngestService {
  initialize(): Promise<void>
  getIngestConfiguration(): Promise<InewsIngestConfiguration>
  saveIngestConfiguration(inewsIngestConfiguration: InewsIngestConfiguration): Promise<void>
}
