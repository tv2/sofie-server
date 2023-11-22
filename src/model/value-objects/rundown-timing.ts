import { RundownTimingType } from '../enums/rundown-timing-type'

export type RundownTiming = ForwardRundownTiming | BackwardRundownTiming | UnscheduledRundownTiming

export interface ForwardRundownTiming {
  readonly type: RundownTimingType.FORWARD,
  readonly expectedStartEpochTime: number,
  readonly expectedDurationInMs?: number
  readonly expectedEndEpochTime?: number,
}

export interface BackwardRundownTiming {
  readonly type: RundownTimingType.BACKWARD,
  readonly expectedEndEpochTime: number,
  readonly expectedDurationInMs?: number
  readonly expectedStartEpochTime?: number
}

export interface UnscheduledRundownTiming {
  readonly type: RundownTimingType.UNSCHEDULED,
  readonly expectedDurationInMs?: number
}
