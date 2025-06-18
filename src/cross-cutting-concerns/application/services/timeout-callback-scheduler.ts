import { CallbackScheduler } from '../interfaces/callback-scheduler'
import { Logger } from '../interfaces/logger'

const EXECUTE_CALLBACK_DURATION_THRESHOLD_IN_MS: number = 1
const SCHEDULE_RESOLUTION: number = 2

export class TimeoutCallbackScheduler implements CallbackScheduler {

  private readonly logger: Logger
  private timeoutIdentifier?: NodeJS.Timeout

  constructor(logger: Logger) {
    this.logger = logger.tag(TimeoutCallbackScheduler.name)
  }

  public start(epochTimeToExecuteCallback: number, callback: () => void): void {
    if (epochTimeToExecuteCallback <= Date.now()) {
      this.logger
        .data({ epochTimeToExecuteCallback: epochTimeToExecuteCallback, now: Date.now() })
        .warn('Skipping execution of callback. Point in time for execution is in the past!')
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
    this.stop()
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
