import { Logger } from '../../cross-cutting-concerns/application/interfaces/logger'
import { Tv2ConsoleLogger } from './services/tv2-console-logger'

export class Tv2LoggerFacade {
  public static createLogger(): Logger {
    return Tv2ConsoleLogger.getInstance()
  }
}