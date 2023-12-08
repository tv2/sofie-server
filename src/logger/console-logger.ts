import { Logger, LogLevel } from './logger'
import { ConsoleVault, NodeEnvironmentLogger } from '@tv2media/logger/node'
import { PlainTextFormat } from '@tv2media/logger'

export class ConsoleLogger extends NodeEnvironmentLogger implements Logger {
  private static instance: ConsoleLogger

  public static getInstance(): ConsoleLogger {
    if (!this.instance) {
      this.instance = new ConsoleLogger()
    }
    return this.instance
  }

  private constructor() {
    super([
      new ConsoleVault({
        level: LogLevel.TRACE,
        format: new PlainTextFormat(),
        isFormatLocked: false,
      })
    ])
  }
}