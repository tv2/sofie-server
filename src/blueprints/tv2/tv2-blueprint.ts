import {
  Blueprint,
  BlueprintGenerateActions,
  BlueprintGetEndStateForPart,
  BlueprintOnTimelineGenerate
} from '../../model/value-objects/blueprint'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'
import { Part } from '../../model/entities/part'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Timeline } from '../../model/entities/timeline'
import { Configuration } from '../../model/entities/configuration'
import { Action, ActionManifest, MutateActionMethods } from '../../model/entities/action'

export class Tv2Blueprint implements Blueprint {
  constructor(
    private readonly endStateForPartService: BlueprintGetEndStateForPart,
    private readonly onTimelineGenerateService: BlueprintOnTimelineGenerate,
    private readonly actionsService: BlueprintGenerateActions
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

  public generateActions(configuration: Configuration, actionManifests: ActionManifest[]): Action[] {
    return this.actionsService.generateActions(configuration, actionManifests)
  }

  public getMutateActionMethods(action: Action): MutateActionMethods[] {
    if (!this.actionsService.getMutateActionMethods) {
      return []
    }
    return this.actionsService.getMutateActionMethods(action)
  }
}
