import { INewsIngestConfiguration, INewsQueueSubscription } from '../../domain/entities/i-news-ingest-configuration'

export class INewsIngestConfigurationDto {
  public queueSubscriptions: INewsQueueSubscriptionDto[]

  public constructor(iNewsIngestConfiguration: INewsIngestConfiguration) {
    this.queueSubscriptions = iNewsIngestConfiguration.queueSubscriptions.map(subscription => new INewsQueueSubscriptionDto(subscription))
  }
}

class INewsQueueSubscriptionDto {
  public queueId: string
  public isDisabled: boolean

  public constructor(iNewsQueueSubscription: INewsQueueSubscription) {
    this.queueId = iNewsQueueSubscription.queueId
    this.isDisabled = iNewsQueueSubscription.isDisabled
  }
}
