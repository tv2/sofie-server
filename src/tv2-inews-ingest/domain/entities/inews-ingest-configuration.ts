import { InewsQueueSubscription } from '../value-objects/ines-queue-subscription'

export interface InewsIngestConfiguration {
  queueSubscriptions: InewsQueueSubscription[]
}
