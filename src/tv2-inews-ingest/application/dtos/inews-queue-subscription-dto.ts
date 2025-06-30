import { InewsQueueSubscription } from '../../domain/value-objects/ines-queue-subscription'

export class InewsQueueSubscriptionDto {
  public queueId: string
  public isDisabled: boolean

  public constructor(inewsQueueSubscription: InewsQueueSubscription) {
    this.queueId = inewsQueueSubscription.queueId
    this.isDisabled = inewsQueueSubscription.isDisabled
  }
}
