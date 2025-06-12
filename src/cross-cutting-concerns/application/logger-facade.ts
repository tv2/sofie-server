import { Logger } from './interfaces/logger'
import { ConsoleLogger } from '../infrastructure/services/console-logger'

export class LoggerFacade {

  private static readonly logger: Logger = new ConsoleLogger()

  public static createLogger(): Logger {
    return this.logger
  }
}