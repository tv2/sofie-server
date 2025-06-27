export interface InewsIngestConfiguration {
  queueSubscriptions: InewsQueueSubscription[]
}

export interface InewsQueueSubscription {
  queueId: string
  isDisabled: boolean
}
