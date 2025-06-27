import { IngestService } from '../interfaces/ingest-service'
import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'
import { InewsIngestConfigurationRepository } from '../../domain/repositories/inews-ingest-configuration-repository'
import { InewsIngestConfigurationEventEmitter } from '../interfaces/inews-ingest-configuration-event-emitter'
import { IngestGatewayConnector } from '../../../rundown-ingest/application/interfaces/ingest-gateway-connector'

export class InewsIngestService implements IngestService {
  public constructor(
    private readonly inewsIngestConfigurationRepository: InewsIngestConfigurationRepository,
    private readonly inewsIngestConfigurationEventEmitter: InewsIngestConfigurationEventEmitter,
    private readonly ingestGatewayConnector: IngestGatewayConnector
  ) { }

  public async initialize(): Promise<void> {
    const inewsIngestConfiguration: InewsIngestConfiguration = await this.inewsIngestConfigurationRepository.get()
    this.ingestGatewayConnector.connect(this.getSubscriptionQueueIds(inewsIngestConfiguration))
  }

  private getSubscriptionQueueIds(inewsIngestConfiguration: InewsIngestConfiguration): string[] {
    return inewsIngestConfiguration.queueSubscriptions
      .filter(subscription => !subscription.isDisabled)
      .map(subscription => subscription.queueId)
  }

  public async getIngestConfiguration(): Promise<InewsIngestConfiguration> {
    return this.inewsIngestConfigurationRepository.get()
  }

  public async saveIngestConfiguration(inewsIngestConfiguration: InewsIngestConfiguration): Promise<void> {
    await this.inewsIngestConfigurationRepository.save(inewsIngestConfiguration)
    this.ingestGatewayConnector.connect(this.getSubscriptionQueueIds(inewsIngestConfiguration))
    this.inewsIngestConfigurationEventEmitter.emitInewsIngestConfigurationUpdated(inewsIngestConfiguration)
  }
}
