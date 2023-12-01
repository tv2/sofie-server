import { DefaultLogger } from '@tv2media/logger/node'

export class Logger extends DefaultLogger {
  private static instance: Logger

  public static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new Logger()
    }
    return this.instance
  }

  private constructor() {
    super()
  }
}