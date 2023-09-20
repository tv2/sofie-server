import { Blueprint } from '../../model/value-objects/blueprint'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Part } from '../../model/entities/part'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Tv2EndStateForPartCalculator } from './tv2-end-state-for-part-calculator'
import { Timeline } from '../../model/entities/timeline'
import { Tv2OnTimelineGenerateCalculator } from './tv2-on-timeline-generate-calculator'
import { Configuration } from '../../model/entities/configuration'
import { Action } from '../../model/entities/action'
import { Tv2ActionsService } from './tv2-actions-service'

export class Tv2Blueprint implements Blueprint {
  constructor(
    private readonly endStateForPartCalculator: Tv2EndStateForPartCalculator,
    private readonly onTimelineGenerateCalculator: Tv2OnTimelineGenerateCalculator,
    private readonly actionsService: Tv2ActionsService
  ) {}

  public getEndStateForPart(
    part: Part,
    previousPart: Part | undefined,
    time: number,
    rundownPersistentState: RundownPersistentState | undefined
  ): PartEndState {
    return this.endStateForPartCalculator.getEndStateForPart(part, previousPart, time, rundownPersistentState)
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
    return this.onTimelineGenerateCalculator.onTimelineGenerate(
      configuration,
      timeline,
      activePart,
      previousRundownPersistentState,
      previousPart
    )
  }

  public generateActions(configuration: Configuration): Action[] {
    return this.actionsService.generateActions(configuration)
  }
}
