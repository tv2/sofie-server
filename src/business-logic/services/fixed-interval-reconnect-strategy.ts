import { Logger } from '@tv2media/logger/*'
import { ReconnectStrategy } from './interfaces/reconnect-strategy'

const RECONNECT_INTERVAL_IN_MS: number = 2000

export class FixedIntervalReconnectStrategy implements ReconnectStrategy {
  private readonly logger: Logger
  private delayTimer?: NodeJS.Timeout

  constructor(logger: Logger) {
    this.logger = logger.tag('FixedIntervalReconnectStrategy')
  }

  public connected(): void {
    return
  }

  public disconnected(connect: () => void): void {
    if (this.delayTimer) {
      return
    }
    this.reconnect(connect)
  }

  private reconnect(connect: () => void): void {
    const reconnectDelay: number = this.getReconnectDelay()
    this.logger.info(`Attempting to reconnect in ${reconnectDelay}ms.`)
    this.delayTimer = setTimeout(this.createConnectWrapper(connect), reconnectDelay)
  }

  private clearDelayTimer(): void {
    if (!this.delayTimer) {
      return
    }
    clearTimeout(this.delayTimer)
    this.delayTimer = undefined
  }

  private createConnectWrapper(connect: () => void): () => void {
    return () => {
      this.clearDelayTimer()
      connect()
    }
  }

  private getReconnectDelay(): number {
    return RECONNECT_INTERVAL_IN_MS
  }
}
