import { Logger } from '../../cross-cutting-concerns/application/logger'
import { Tv2ConsoleLogger } from './tv2-console-logger'

export class Tv2LoggerFacade {
  public static createLogger(): Logger {
    return Tv2ConsoleLogger.getInstance()
  }
}