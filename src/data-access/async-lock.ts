export class AsyncLock {
  private isExecutingOperation: boolean = false
  private readonly queuedOperations: (() => Promise<void>)[] = []

  public withLock<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.enqueueOperation(() => operation().then(resolve).catch(reject))
    })
  }

  private enqueueOperation(operation: () => Promise<void>): void {
    this.queuedOperations.push(operation)
    this.executeQueuedOperation()
  }

  private executeQueuedOperation(): void {
    if (this.isExecutingOperation) {
      return
    }
    this.isExecutingOperation = true

    const operation: (() => Promise<void>) | undefined = this.queuedOperations.shift()
    if (!operation) {
      this.isExecutingOperation = false
      return
    }

    operation().catch(() => {}).finally(() => {
      this.isExecutingOperation = false
      this.executeQueuedOperation()
    })
  }
}
