import { Level as LogLevel } from '@tv2media/logger'

export { Level as LogLevel } from '@tv2media/logger'

export interface Logger {
  error(message: string, metadata?: object): void
  warn(message: string, metadata?: object): void
  info(message: string, metadata?: object): void
  debug(message: string, metadata?: object): void
  trace(message: string, metadata?: object): void
  metadata(metadata: object): Logger
  tag(tag: string): Logger
  data(data: unknown): Logger
  setLevel(level: LogLevel): void
}
