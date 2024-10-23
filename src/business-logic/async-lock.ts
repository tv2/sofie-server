import { Logger } from '../logger/logger'

interface EnqueuedOperation {
  operation: () => Promise<void>
  operationName: string
  enqueuedAtTimestampInMs: number
}

export class AsyncLock {
  private isExecutingOperation: boolean = false
  private readonly queuedOperations: EnqueuedOperation[] = []
  private readonly logger: Logger

  constructor(logger: Logger) {
    this.logger = logger.tag(this.constructor.name)
  }

  public withLock<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.enqueueOperation(operationName, () => operation().then(resolve).catch(reject))
    })
  }

  private enqueueOperation(operationName: string, operation: () => Promise<void>): void {
    this.queuedOperations.push({ operation, operationName, enqueuedAtTimestampInMs: Date.now() })
    this.executeQueuedOperation()
  }

  private executeQueuedOperation(): void {
    if (this.isExecutingOperation) {
      return
    }
    this.isExecutingOperation = true

    const enqueuedOperation: EnqueuedOperation | undefined = this.queuedOperations.shift()
    if (!enqueuedOperation) {
      this.isExecutingOperation = false
      return
    }

    this.logOperationDelay(enqueuedOperation)
    enqueuedOperation.operation().catch(() => {}).finally(() => {
      this.isExecutingOperation = false
      this.executeQueuedOperation()
    })
  }

  private logOperationDelay(enqueuedOperation: EnqueuedOperation): void {
    const delayInMs: number = Date.now() - enqueuedOperation.enqueuedAtTimestampInMs
    if (delayInMs < 1) {
      return
    }
    this.logger.warn(`Operation '${enqueuedOperation.operationName}' was delayed by ${delayInMs}ms.`)
  }
}
