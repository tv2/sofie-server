import { InewsIngestConfiguration, InewsQueueSubscription } from '../../domain/entities/inews-ingest-configuration'

export class InewsIngestConfigurationDto {
  public queueSubscriptions: InewsQueueSubscriptionDto[]

  public constructor(inewsIngestConfiguration: InewsIngestConfiguration) {
    this.queueSubscriptions = inewsIngestConfiguration.queueSubscriptions.map(subscription => new InewsQueueSubscriptionDto(subscription))
  }
}

class InewsQueueSubscriptionDto {
  public queueId: string
  public isDisabled: boolean

  public constructor(inewsQueueSubscription: InewsQueueSubscription) {
    this.queueId = inewsQueueSubscription.queueId
    this.isDisabled = inewsQueueSubscription.isDisabled
  }
}
