import { Blueprint } from '../../model/value-objects/blueprint'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Part } from '../../model/entities/part'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Tv2EndStateForPartCalculator } from './tv2-end-state-for-part-calculator'
import { Timeline } from '../../model/entities/timeline'
import { Tv2OnTimelineGenerateCalculator } from './tv2-on-timeline-generate-calculator'
import { Configuration } from '../../model/entities/configuration'

export class Tv2Blueprint implements Blueprint {
  constructor(
    private readonly endStateForPartCalculator: Tv2EndStateForPartCalculator,
    private readonly onTimelineGenerateCalculator: Tv2OnTimelineGenerateCalculator
  ) {}

  public getEndStateForPart(
    part: Part,
    previousPart: Part,
    time: number,
    rundownPersistentState?: RundownPersistentState
  ): PartEndState {
    return this.endStateForPartCalculator.getEndStateForPart(part, previousPart, time, rundownPersistentState)
  }

  public onTimelineGenerate(
    configuration: Configuration,
    previousRundownPersistentState: RundownPersistentState,
    currentPart: Part,
    previousPart: Part,
    timeline: Timeline
  ): {
      timeline: Timeline
      rundownPersistentState: RundownPersistentState
    } {
    return this.onTimelineGenerateCalculator.onTimelineGenerate(
      configuration,
      previousRundownPersistentState,
      currentPart,
      previousPart,
      timeline
    )
  }
}
