import { InewsQueueSubscription } from '../../domain/value-objects/inews-queue-subscription'

export class InewsQueueSubscriptionDto {
  public readonly queueId: string
  public readonly isDisabled: boolean

  public constructor(inewsQueueSubscription: InewsQueueSubscription) {
    this.queueId = inewsQueueSubscription.queueId
    this.isDisabled = inewsQueueSubscription.isDisabled
  }
}
