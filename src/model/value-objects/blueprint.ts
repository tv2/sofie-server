import { PartEndState } from './part-end-state'
import { Part } from '../entities/part'
import { RundownPersistentState } from './rundown-persistent-state'
import { Timeline } from '../entities/timeline'
import { Configuration } from '../entities/configuration'
import { OnTimelineGenerateResult } from './on-timeline-generate-result'
import { Action, ActionManifest, MutateActionMethods } from '../entities/action'

export type Blueprint = BlueprintOnTimelineGenerate & BlueprintGetEndStateForPart & BlueprintGenerateActions

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

export interface BlueprintGenerateActions {
  generateActions(configuration: Configuration, actionManifests: ActionManifest[]): Action[]

  /**
   * If any Action need to have data only accessible at the time of executing the action,
   * they need to return a "MutateActionMethods" when this method is called with the given action.
   * Examples could be adding a MixEffect transition when switching source on the Video Mixer. Which source to switch
   * to is only known when the Action is being executed and not at initial creation of the action.
   *
   * "MutateActionMethods" contains two callbacks.
   * A callback to do the actual mutating of the action.
   * A callback/predicate to help find which planned Piece the Action need data from.
   *
   * Any Action not interested in mutating its data at execution time can simply ignore this method.
   */
  getMutateActionMethods?(action: Action): MutateActionMethods[]
}
