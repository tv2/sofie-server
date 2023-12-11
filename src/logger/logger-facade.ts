import { Logger } from './logger'
import { ConsoleLogger } from './console-logger'

export class LoggerFacade {
  public static createLogger(): Logger {
    return ConsoleLogger.getInstance()
  }
}