import { Level as LogLevel } from '@tv2media/logger'

export { Level as LogLevel } from '@tv2media/logger'

export interface Tv2Logger {
  error(message: string, metadata?: object): void
  warn(message: string, metadata?: object): void
  info(message: string, metadata?: object): void
  debug(message: string, metadata?: object): void
  trace(message: string, metadata?: object): void
  metadata(metadata: object): Tv2Logger
  tag(tag: string): Tv2Logger
  data(data: unknown): Tv2Logger
  setLevel(level: LogLevel): void
}
