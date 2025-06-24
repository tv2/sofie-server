import { IngestService } from '../interfaces/ingest-service'
import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'
import { INewsIngestConfigurationRepository } from '../../domain/repositories/i-news-ingest-configuration-repository'

export class INewsIngestService implements IngestService {
  public constructor(private readonly iNewsIngestConfigurationRepository: INewsIngestConfigurationRepository) { }

  public async getIngestConfiguration(): Promise<INewsIngestConfiguration> {
    return this.iNewsIngestConfigurationRepository.get()
  }

  public async saveIngestConfiguration(iNewsIngestConfiguration: INewsIngestConfiguration): Promise<void> {
    await this.iNewsIngestConfigurationRepository.save(iNewsIngestConfiguration)
  }
}
