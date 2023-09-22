import { Timeline } from '../entities/timeline'
import { RundownPersistentState } from './rundown-persistent-state'

export interface OnTimelineGenerateResult {
  timeline: Timeline,
  rundownPersistentState: RundownPersistentState
}
