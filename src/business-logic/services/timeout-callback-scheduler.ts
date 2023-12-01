import { CallbackScheduler } from './interfaces/callback-scheduler'
import { ConsoleLogger } from '../../console-logger'
import { Logger } from '../../logger'

const EXECUTE_CALLBACK_DURATION_THRESHOLD_IN_MS: number = 1
const SCHEDULE_RESOLUTION: number = 2

export class TimeoutCallbackScheduler implements CallbackScheduler {
  private static instance: CallbackScheduler

  public static getInstance(logger: ConsoleLogger): CallbackScheduler {
    if (!this.instance) {
      this.instance = new TimeoutCallbackScheduler(logger)
    }
    return this.instance
  }
  private readonly logger: Logger
  private timeoutIdentifier?: NodeJS.Timeout

  private constructor(logger: ConsoleLogger) {
    this.logger = logger.tag(TimeoutCallbackScheduler.name)
  }

  public start(epochTimeToExecuteCallback: number, callback: () => void): void {
    if (epochTimeToExecuteCallback <= Date.now()) {
      this.logger.warn('Skipping execution of callback. Point in time for execution is in the past!')
      return
    }
    this.scheduleCallback(epochTimeToExecuteCallback, callback)
  }

  private scheduleCallback(epochTimeToExecuteCallback: number, callback: () => void): void {
    const durationToExecuteCallbackInMs: number = epochTimeToExecuteCallback - Date.now()
    if (durationToExecuteCallbackInMs < EXECUTE_CALLBACK_DURATION_THRESHOLD_IN_MS) {
      callback()
      return
    }
    const durationToNextSchedulingInMs: number = durationToExecuteCallbackInMs / SCHEDULE_RESOLUTION
    this.timeoutIdentifier = setTimeout(() => {
      this.timeoutIdentifier = undefined
      this.scheduleCallback(epochTimeToExecuteCallback, callback)
    }, durationToNextSchedulingInMs)
  }

  public stop(): void {
    if (!this.timeoutIdentifier) {
      return
    }
    clearTimeout(this.timeoutIdentifier)
    this.timeoutIdentifier = undefined
  }
}
