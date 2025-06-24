import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'

export interface IngestService {
  getIngestConfiguration(): Promise<INewsIngestConfiguration>
  saveIngestConfiguration(iNewsIngestConfiguration: INewsIngestConfiguration): Promise<void>
}
