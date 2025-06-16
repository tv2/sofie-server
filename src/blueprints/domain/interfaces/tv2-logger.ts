import { Level as LogLevel } from '@tv2media/logger'

export { Level as LogLevel } from '@tv2media/logger'

// TODO: This is current in domain, since it where it is used. We should aim towards not logging in the domain.
// The use of Result objects from the domain or using a domain event bus can be possible solutions.
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
