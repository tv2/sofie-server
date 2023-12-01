import { DefaultLogger } from '@tv2media/logger/node'
import { Logger } from './logger'

export class ConsoleLogger extends DefaultLogger implements Logger {
  private static instance: ConsoleLogger

  public static getInstance(): ConsoleLogger {
    if (!this.instance) {
      this.instance = new ConsoleLogger()
    }
    return this.instance
  }

  private constructor() {
    super()
  }
}