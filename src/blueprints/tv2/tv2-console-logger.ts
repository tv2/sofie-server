import { ConsoleVault, NodeEnvironmentLogger } from '@tv2media/logger/node'
import { LogLevel, Tv2Logger } from './tv2-logger'
import { PlainTextFormat } from '@tv2media/logger'

export class Tv2ConsoleLogger extends NodeEnvironmentLogger implements Tv2Logger {
  private static instance: Tv2ConsoleLogger

  public static getInstance(): Tv2ConsoleLogger {
    if (!this.instance) {
      this.instance = new Tv2ConsoleLogger()
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