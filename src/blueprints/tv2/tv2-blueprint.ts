import { Blueprint } from '../../model/value-objects/blueprint'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Part } from '../../model/entities/part'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { Timeline } from '../../model/entities/timeline'
import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { Configuration } from '../../model/entities/configuration'

export class Tv2Blueprint implements Blueprint {
  constructor(
    private readonly endStateForPartService: Tv2EndStateForPartService,
    private readonly onTimelineGenerateService: Tv2OnTimelineGenerateService
  ) {}

  public getEndStateForPart(
    part: Part,
    previousPart: Part | undefined,
    time: number,
    rundownPersistentState: RundownPersistentState | undefined
  ): PartEndState {
    return this.endStateForPartService.getEndStateForPart(part, previousPart, time, rundownPersistentState)
  }

  public onTimelineGenerate(
    configuration: Configuration,
    timeline: Timeline,
    activePart: Part,
    previousRundownPersistentState: RundownPersistentState | undefined,
    previousPart: Part | undefined,
  ): {
      timeline: Timeline
      rundownPersistentState: RundownPersistentState
    } {
    return this.onTimelineGenerateService.onTimelineGenerate(
      configuration,
      timeline,
      activePart,
      previousRundownPersistentState,
      previousPart
    )
  }
}
