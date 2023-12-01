import { DefaultLogger } from '@tv2media/logger/node'

export class Tv2Logger extends DefaultLogger {
  private static instance: Tv2Logger

  public static getInstance(): Tv2Logger {
    if (!this.instance) {
      this.instance = new Tv2Logger()
    }
    return this.instance
  }

  private constructor() {
    super()
  }
}