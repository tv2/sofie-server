import { InewsQueueSubscription } from '../value-objects/inews-queue-subscription'

export interface InewsIngestConfiguration {
  queueSubscriptions: InewsQueueSubscription[]
}
