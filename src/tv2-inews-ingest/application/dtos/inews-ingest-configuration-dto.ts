import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'
import { InewsQueueSubscriptionDto } from './inews-queue-subscription-dto'

export class InewsIngestConfigurationDto {
  public queueSubscriptions: InewsQueueSubscriptionDto[]

  public constructor(inewsIngestConfiguration: InewsIngestConfiguration) {
    this.queueSubscriptions = inewsIngestConfiguration.queueSubscriptions.map(subscription => new InewsQueueSubscriptionDto(subscription))
  }
}
