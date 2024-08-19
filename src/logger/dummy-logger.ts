import  { Logger } from './logger'
import { LoggerBase } from '@tv2media/logger'

export class DummyLogger extends LoggerBase implements Logger {
  constructor() {
    super([])
  }
}
