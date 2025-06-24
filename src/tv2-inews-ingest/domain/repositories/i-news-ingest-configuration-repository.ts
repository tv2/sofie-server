import { INewsIngestConfiguration } from '../entities/i-news-ingest-configuration'

export interface INewsIngestConfigurationRepository {
  get(): Promise<INewsIngestConfiguration>
  save(iNewsIngestConfiguration: INewsIngestConfiguration): Promise<void>
}
