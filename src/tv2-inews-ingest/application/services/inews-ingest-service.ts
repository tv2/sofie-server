import { IngestService } from '../interfaces/ingest-service'
import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'
import { InewsIngestConfigurationRepository } from '../../domain/repositories/inews-ingest-configuration-repository'
import { InewsIngestConfigurationEventEmitter } from '../interfaces/inews-ingest-configuration-event-emitter'

export class InewsIngestService implements IngestService {
  public constructor(
    private readonly inewsIngestConfigurationRepository: InewsIngestConfigurationRepository,
    private readonly inewsIngestConfigurationEventEmitter: InewsIngestConfigurationEventEmitter
  ) { }

  public async getIngestConfiguration(): Promise<InewsIngestConfiguration> {
    return this.inewsIngestConfigurationRepository.get()
  }

  public async saveIngestConfiguration(inewsIngestConfiguration: InewsIngestConfiguration): Promise<void> {
    await this.inewsIngestConfigurationRepository.save(inewsIngestConfiguration)
    this.inewsIngestConfigurationEventEmitter.emitInewsIngestConfigurationUpdated(inewsIngestConfiguration)
  }
}
