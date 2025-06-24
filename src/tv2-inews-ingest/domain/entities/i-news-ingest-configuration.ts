export interface INewsIngestConfiguration {
  queueSubscriptions: INewsQueueSubscription[]
}

export interface INewsQueueSubscription {
  queueId: string
  isDisabled: boolean
}
