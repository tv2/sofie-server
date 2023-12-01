import { DefaultLogger } from '@tv2media/logger/node'
import { Tv2Logger } from './tv2-logger'

export class Tv2ConsoleLogger extends DefaultLogger implements Tv2Logger {
  private static instance: Tv2ConsoleLogger

  public static getInstance(): Tv2ConsoleLogger {
    if (!this.instance) {
      this.instance = new Tv2ConsoleLogger()
    }
    return this.instance
  }

  private constructor() {
    super()
  }
}