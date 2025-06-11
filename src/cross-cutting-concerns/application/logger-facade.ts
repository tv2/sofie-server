import { Logger } from './interfaces/logger'
import { ConsoleLogger } from '../infrastructure/services/console-logger'

export class LoggerFacade {
  public static createLogger(): Logger {
    return ConsoleLogger.getInstance()
  }
}