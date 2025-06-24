import { IngestService } from '../interfaces/ingest-service'
import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'
import { INewsIngestConfigurationRepository } from '../../domain/repositories/i-news-ingest-configuration-repository'
import { INewsIngestConfigurationEventEmitter } from '../interfaces/i-news-ingest-configuration-event-emitter'

export class INewsIngestService implements IngestService {
  public constructor(
    private readonly iNewsIngestConfigurationRepository: INewsIngestConfigurationRepository,
    private readonly iNewsIngestConfigurationEventEmitter: INewsIngestConfigurationEventEmitter
  ) { }

  public async getIngestConfiguration(): Promise<INewsIngestConfiguration> {
    return this.iNewsIngestConfigurationRepository.get()
  }

  public async saveIngestConfiguration(iNewsIngestConfiguration: INewsIngestConfiguration): Promise<void> {
    await this.iNewsIngestConfigurationRepository.save(iNewsIngestConfiguration)
    this.iNewsIngestConfigurationEventEmitter.emitINewsIngestConfigurationUpdated(iNewsIngestConfiguration)
  }
}
