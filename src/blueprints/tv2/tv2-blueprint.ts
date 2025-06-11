import {
  Blueprint, BlueprintBaselinePieces,
  BlueprintGenerateActions,
  BlueprintGetEndStateForPart,
  BlueprintOnTimelineGenerate, BlueprintValidateConfiguration
} from '../../rundown-execution/domain/value-objects/blueprint'
import { RundownPersistentState } from '../../rundown-execution/domain/value-objects/rundown-persistent-state'
import { Part } from '../../rundown-execution/domain/entities/part'
import { PartEndState } from '../../rundown-execution/domain/value-objects/part-end-state'
import { Timeline } from '../../rundown-execution/domain/entities/timeline'
import { Configuration } from '../../rundown-execution/domain/entities/configuration'
import { Action, ActionManifest, MutateActionMethods } from '../../action-system/domain/entities/action'
import { Tv2Action } from './value-objects/tv2-action'
import { StatusMessage } from '../../rundown-execution/domain/entities/status-message'
import { Piece } from '../../rundown-execution/domain/entities/piece'

export class Tv2Blueprint implements Blueprint {
  constructor(
    private readonly endStateForPartService: BlueprintGetEndStateForPart,
    private readonly onTimelineGenerateService: BlueprintOnTimelineGenerate,
    private readonly actionsService: BlueprintGenerateActions,
    private readonly configurationValidator: BlueprintValidateConfiguration,
    private readonly baselinePiecesGenerator: BlueprintBaselinePieces
  ) {
  }

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
    showStyleVariantId: string,
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
      showStyleVariantId,
      timeline,
      activePart,
      previousRundownPersistentState,
      previousPart
    )
  }

  public generateActions(configuration: Configuration, showStyleVariantId: string, actionManifests: ActionManifest[]): Action[] {
    return this.actionsService.generateActions(configuration, showStyleVariantId, actionManifests)
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    if (!this.actionsService.getMutateActionMethods) {
      return []
    }
    return this.actionsService.getMutateActionMethods(action)
  }

  public validateConfiguration(configuration: Configuration): StatusMessage[] {
    return this.configurationValidator.validateConfiguration(configuration)
  }

  public generateBaselinePieces(rundownId: string, configuration: Configuration): Piece[] {
    return this.baselinePiecesGenerator.generateBaselinePieces(rundownId, configuration)
  }
}
