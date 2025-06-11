import { Logger } from './interfaces/logger'
import { ConsoleLogger } from '../infrastructure/console-logger'

export class LoggerFacade {
  public static createLogger(): Logger {
    return ConsoleLogger.getInstance()
  }
}