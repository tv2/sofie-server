import { PartEndState } from './part-end-state'
import { Part } from '../entities/part'
import { RundownPersistentState } from './rundown-persistent-state'
import { Timeline } from '../entities/timeline'
import { Configuration } from '../entities/configuration'
import { OnTimelineGenerateResult } from './on-timeline-generate-result'

export interface Blueprint extends BlueprintOnTimelineGenerate, BlueprintGetEndStateForPart {}

export interface BlueprintOnTimelineGenerate {
  onTimelineGenerate(
    configuration: Configuration,
    timeline: Timeline,
    activePart: Part,
    previousRundownPersistentState: RundownPersistentState | undefined,
    previousPart: Part | undefined,
  ): OnTimelineGenerateResult
}

export interface BlueprintGetEndStateForPart {
  getEndStateForPart(
    part: Part,
    previousPart: Part | undefined,
    time: number,
    rundownPersistentState: RundownPersistentState | undefined
  ): PartEndState
}
