import { Logger, LogLevel } from '../../application/interfaces/logger'
import { ConsoleVault, NodeEnvironmentLogger } from '@tv2media/logger/node'
import { PlainTextFormat } from '@tv2media/logger'

export class ConsoleLogger extends NodeEnvironmentLogger implements Logger {
  constructor() {
    super([
      new ConsoleVault({
        level: LogLevel.TRACE,
        format: new PlainTextFormat(),
        isFormatLocked: false,
      })
    ])
  }
}