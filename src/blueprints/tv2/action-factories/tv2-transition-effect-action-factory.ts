import {
  Action,
  ActionArgumentType,
  MutateActionMethods,
  MutateActionType,
  MutateActionWithPieceMethods
} from '../../../model/entities/action'
import { PieceActionType } from '../../../model/enums/action-type'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import {
  Tv2Action,
  Tv2ActionContentType,
  Tv2BreakerTransitionEffectActionMetadata,
  Tv2DipTransitionEffectActionMetadata,
  Tv2MixTransitionEffectActionMetadata,
  Tv2TransitionEffectAction,
  Tv2TransitionEffectActionMetadata
} from '../value-objects/tv2-action'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Breaker,
  BreakerTransitionEffect,
  TransitionEffectType
} from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import { Tv2DownstreamKeyer, Tv2DownstreamKeyerRole } from '../value-objects/tv2-studio-blueprint-configuration'
import { InTransition } from '../../../model/value-objects/in-transition'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2AssetPathHelper } from '../helpers/tv2-asset-path-helper'
import {
  Tv2VideoClipTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-clip-timeline-object-factory'
import { Tv2BlueprintTimelineObject } from '../value-objects/tv2-metadata'
import { Tv2Logger } from '../tv2-logger'

const FRAME_RATE: number = 25
const MINIMUM_DURATION_IN_MS: number = 1000

enum SpecialEffectName {
  MIX = 'Mix',
  DIP = 'Dip'
}

export class Tv2TransitionEffectActionFactory {
  private readonly logger: Tv2Logger

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly videoClipTimelineObjectFactory: Tv2VideoClipTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly assetPathHelper: Tv2AssetPathHelper,
    logger: Tv2Logger
  ) {
    this.logger = logger.tag(Tv2TransitionEffectActionFactory.name)
  }

  public createTransitionEffectActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createEmptyMixTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT),
      this.createEmptyMixTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE),
      this.createEmptyDipTransitionEffectAction(
        PieceActionType.INSERT_PIECE_AS_NEXT,
        blueprintConfiguration.studio.videoMixerBasicConfiguration.dipVideoMixerSource,
      ),
      this.createEmptyDipTransitionEffectAction(
        PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE,
        blueprintConfiguration.studio.videoMixerBasicConfiguration.dipVideoMixerSource,
      ),
      ...blueprintConfiguration.showStyle.breakerTransitionEffectConfigurations.flatMap(transitionEffect => {
        return [
          this.createBreakerTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT, transitionEffect, blueprintConfiguration),
          this.createBreakerTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE, transitionEffect, blueprintConfiguration)
        ]
      })]
  }

  public isTransitionEffectAction(action: Tv2Action): action is Tv2TransitionEffectAction {
    return action.metadata.contentType === Tv2ActionContentType.TRANSITION
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    if (!this.isTransitionEffectAction(action)) {
      return []
    }

    const mutateActionMethods: MutateActionMethods[] = []

    switch (action.metadata.transitionEffectType) {
      case TransitionEffectType.CUT:
      case TransitionEffectType.BREAKER: {
        break
      }
      case TransitionEffectType.DIP: {
        mutateActionMethods.push({
          type: MutateActionType.APPLY_ARGUMENTS,
          updateActionWithArguments: (action: Action, actionArguments: unknown) => {
            if (!this.isTransitionDurationArgumentInteger(actionArguments)) {
              throw new Tv2MisconfigurationException(`DipTransitionAction expects 'actionArguments' to be an integer. ${actionArguments} is not an integer.`)
            }
            const transitionEffectAction: Tv2TransitionEffectAction = action as Tv2TransitionEffectAction
            const metadata: Tv2DipTransitionEffectActionMetadata =  transitionEffectAction.metadata as Tv2DipTransitionEffectActionMetadata
            return this.createDipTransitionEffectAction(transitionEffectAction.type, actionArguments, metadata.dipInput)
          }
        })
        break
      }
      case TransitionEffectType.MIX: {
        mutateActionMethods.push({
          type: MutateActionType.APPLY_ARGUMENTS,
          updateActionWithArguments: (action: Action, actionArguments: unknown) => {
            if (!this.isTransitionDurationArgumentInteger(actionArguments)) {
              throw new Tv2MisconfigurationException(`MixTransitionAction expects 'actionArguments' to be an integer. ${actionArguments} is not an integer.`)
            }
            const transitionEffectAction: Tv2TransitionEffectAction = action as Tv2TransitionEffectAction
            return this.createMixTransitionEffectAction(transitionEffectAction.type, actionArguments)
          }
        })
        break
      }
    }

    const updateTransitionMutateAction: MutateActionWithPieceMethods = {
      type: MutateActionType.PIECE,
      updateActionWithPiece: (action: Action, piece: Piece) => this.updateTimelineObjectsWithTransitionEffect(action as Tv2TransitionEffectAction, piece),
      piecePredicate: (piece: Piece) => piece.timelineObjects.some(timelineObject => timelineObject.layer === this.videoMixerTimelineObjectFactory.getProgramLayer()),
    }
    mutateActionMethods.push(updateTransitionMutateAction)
    return mutateActionMethods
  }

  private isTransitionDurationArgumentInteger(transitionDurationInFrames: unknown): transitionDurationInFrames is number {
    if (!Number.isInteger(transitionDurationInFrames)) {
      throw new Tv2MisconfigurationException(`Then transition duration of the Action must be an integer. ${transitionDurationInFrames} is not an integer`)
    }
    return true
  }

  private createPieceInterface(effectName: string, durationFrames: number): Tv2PieceInterface {
    return {
      id: `${effectName}TransitionActionPiece`,
      name: `${effectName} transition`,
      partId: '',
      layer: Tv2SourceLayer.JINGLE,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.IN_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: Math.max(this.getTimeFromFrames(durationFrames), MINIMUM_DURATION_IN_MS),
      postRollDuration: 0,
      preRollDuration: 0,
      tags: [],
      isUnsynced: false,
      timelineObjects: [],
      metadata: {
        type: Tv2PieceType.TRANSITION,
        outputLayer: Tv2OutputLayer.SECONDARY
      }
    }
  }

  private getTimeFromFrames(frames: number): number {
    return (1000 / FRAME_RATE) * frames
  }

  private createTransitionEffectAction(actionType: PieceActionType, effectName: string, metadata: Tv2TransitionEffectActionMetadata, pieceInterface: Tv2PieceInterface): Tv2TransitionEffectAction {
    return {
      id: `${effectName}_transition_action_${actionType.toString()}`,
      name: this.mapToTransitionEffectNameForActionType(actionType, effectName),
      description: this.mapToTransitionEffectDescriptionForActionType(actionType, effectName),
      type: actionType,
      data: {
        pieceInterface
      },
      metadata
    }
  }

  private mapToTransitionEffectNameForActionType(actionType: PieceActionType, effectName: string): string {
    switch (actionType) {
      case PieceActionType.INSERT_PIECE_AS_NEXT: {
        return `${this.getEffectNamePrefix(effectName)}${effectName} on Next`
      }
      case PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE: {
        return `${this.getEffectNamePrefix(effectName)}${effectName} and Take`
      }
      case PieceActionType.REPLACE_PIECE:
      case PieceActionType.INSERT_PIECE_AS_ON_AIR:
      default: {
        throw new Tv2MisconfigurationException(`ActionType ${actionType} is currently not supported.`)
      }
    }
  }

  private getEffectNamePrefix(effectName: string): string {
    if ([SpecialEffectName.MIX.toString(), SpecialEffectName.DIP.toString()].includes(effectName)) {
      return ''
    }
    return 'Effect '
  }

  private mapToTransitionEffectDescriptionForActionType(actionType: PieceActionType, effectName: string): string {
    switch (actionType) {
      case PieceActionType.INSERT_PIECE_AS_NEXT: {
        return `Applies ${this.getEffectNamePrefix(effectName)}${effectName} on the next Take`
      }
      case PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE: {
        return `Execute a Take with the ${this.getEffectNamePrefix(effectName)}${effectName} applied`
      }
      case PieceActionType.REPLACE_PIECE:
      case PieceActionType.INSERT_PIECE_AS_ON_AIR:
      default: {
        throw new Tv2MisconfigurationException(`ActionType ${actionType} is currently not supported.`)
      }
    }
  }

  /**
   * Creates an "empty" Mix transition effect Action.
   * The Action will be "populated" with a PieceInterface from the APPLY ARGUMENTS mutateActionMethod where it will also get the transition duration as an argument.
   */
  private createEmptyMixTransitionEffectAction(actionType: PieceActionType): Tv2TransitionEffectAction {
    const metadata: Tv2MixTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.MIX,
      durationInFrames: 0 // Default duration - To be overridden by APPLY ARGUMENTS
    }
    return {
      id: `mix_transition_action_${actionType.toString()}`,
      name: this.mapToTransitionEffectNameForActionType(actionType, SpecialEffectName.MIX),
      description: this.mapToTransitionEffectDescriptionForActionType(actionType, SpecialEffectName.MIX),
      type: actionType,
      data: {
        pieceInterface: {} as PieceInterface
      },
      metadata,
      argument: {
        name: 'Transition duration',
        description: 'The duration of the transition in frames',
        type: ActionArgumentType.NUMBER
      }
    }
  }

  /**
   * Creates an "empty" Dip transition effect Action.
   * The Action will be "populated" with a PieceInterface from the APPLY ARGUMENTS mutateActionMethod where it will also get the transition duration as an argument.
   */
  private createEmptyDipTransitionEffectAction(actionType: PieceActionType, dipInputSource: number): Tv2TransitionEffectAction {
    const metadata: Tv2DipTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.DIP,
      durationInFrames: 0, // Default duration - To be overridden by APPLY ARGUMENTS,
      dipInput: dipInputSource
    }
    return {
      id: `dip_transition_action_${actionType.toString()}`,
      name: this.mapToTransitionEffectNameForActionType(actionType, SpecialEffectName.DIP),
      description: this.mapToTransitionEffectDescriptionForActionType(actionType, SpecialEffectName.DIP),
      type: actionType,
      data: {
        pieceInterface: {} as PieceInterface
      },
      metadata,
      argument: {
        name: 'Transition duration',
        description: 'The duration of the transition in frames',
        type: ActionArgumentType.NUMBER
      }
    }
  }

  private createMixTransitionEffectAction(actionType: PieceActionType, durationInFrames: number): Tv2TransitionEffectAction {
    const effectName: string = `Mix${durationInFrames}`
    const pieceInterface: Tv2PieceInterface = this.createPieceInterface(effectName, durationInFrames)
    const metadata: Tv2MixTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.MIX,
      durationInFrames
    }
    return this.createTransitionEffectAction(actionType, effectName, metadata, pieceInterface)
  }

  private createDipTransitionEffectAction(actionType: PieceActionType, durationInFrames: number, configuredDipInput: number): Tv2TransitionEffectAction {
    const effectName: string = `Dip${durationInFrames}`
    const pieceInterface: Tv2PieceInterface = this.createPieceInterface(effectName, durationInFrames)
    const metadata: Tv2DipTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.DIP,
      durationInFrames,
      dipInput: configuredDipInput
    }
    return this.createTransitionEffectAction(actionType, effectName, metadata, pieceInterface)
  }

  private createBreakerTransitionEffectAction(actionType: PieceActionType, transitionEffect: BreakerTransitionEffect, configuration: Tv2BlueprintConfiguration): Tv2TransitionEffectAction {
    const breaker: Breaker | undefined = this.findBreakerFromConfiguration(transitionEffect, configuration)

    const pieceInterface: Tv2PieceInterface = this.createPieceInterface(breaker.name, breaker.durationInFrames)
    const metadata: Tv2BreakerTransitionEffectActionMetadata = this.createBreakerTransitionEffectMetadata(breaker, configuration)
    return this.createTransitionEffectAction(actionType, breaker.name, metadata, pieceInterface)
  }

  private findBreakerFromConfiguration(transitionEffect: BreakerTransitionEffect, configuration: Tv2BlueprintConfiguration): Breaker {
    const breaker: Breaker | undefined = configuration.showStyle.breakers.find(breaker => breaker.name === transitionEffect.name)
    if (!breaker) {
      throw new Tv2MisconfigurationException(`Can't create Transition Effect Action for ${transitionEffect.name}. ${transitionEffect.name} is missing in Configurations`)
    }
    return breaker
  }

  private createBreakerTransitionEffectMetadata(breaker: Breaker, configuration: Tv2BlueprintConfiguration): Tv2BreakerTransitionEffectActionMetadata {
    const breakerDsk: Tv2DownstreamKeyer = this.findDownstreamKeyerFromConfiguration(configuration)
    return {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.BREAKER,
      casparCgPreRollDuration: configuration.studio.casparCgPreRollDuration,
      downstreamKeyer: breakerDsk,
      breakerFolder: configuration.studio.jingleFolder?.name ?? '',
      breaker
    }
  }

  private findDownstreamKeyerFromConfiguration(configuration: Tv2BlueprintConfiguration): Tv2DownstreamKeyer {
    const breakerDsk: Tv2DownstreamKeyer | undefined = configuration.studio.videoMixerBasicConfiguration.downstreamKeyers.find(dsk => dsk.roles.includes(Tv2DownstreamKeyerRole.JINGLE))
    if (!breakerDsk) {
      throw new Tv2MisconfigurationException('Can\'t create Transition Effect Action. No DSK has been configured for Jingles.')
    }
    return breakerDsk
  }

  private updateTimelineObjectsWithTransitionEffect(action: Tv2TransitionEffectAction, piece: Piece): Tv2TransitionEffectAction {
    const sourceInput: number | undefined = this.videoMixerTimelineObjectFactory.findProgramSourceInputFromPiece(piece)
    if (!sourceInput) {
      this.logger.data({ action, piece }).warn('Can\'t find a Program SourceInput to put the Transition Effect on')
      return action
    }

    switch (action.metadata.transitionEffectType) {
      case TransitionEffectType.CUT: {
        const cutTransitionTimelineObject: Tv2BlueprintTimelineObject = this.videoMixerTimelineObjectFactory.createCutTransitionEffectTimelineObject(sourceInput)
        action.data.pieceInterface.timelineObjects.push(cutTransitionTimelineObject)
        break
      }
      case TransitionEffectType.MIX: {
        const mixTransitionTimelineObject: Tv2BlueprintTimelineObject = this.videoMixerTimelineObjectFactory.createMixTransitionEffectTimelineObject(sourceInput, action.metadata.durationInFrames)
        action.data.pieceInterface.timelineObjects.push(mixTransitionTimelineObject)
        break
      }
      case TransitionEffectType.DIP: {
        const dipTransitionTimelineObject: Tv2BlueprintTimelineObject = this.videoMixerTimelineObjectFactory.createDipTransitionEffectTimelineObject(sourceInput, action.metadata.durationInFrames, action.metadata.dipInput)
        action.data.pieceInterface.timelineObjects.push(dipTransitionTimelineObject)
        break
      }
      case TransitionEffectType.BREAKER: {
        action.data.pieceInterface.timelineObjects.push(...this.createTimelineObjectsForBreakerTransitionEffect(action.metadata))
        action.data.partInTransition = this.createPartInTransitionForBreakerTransitionEffect(action.metadata)
        break
      }
    }

    return action
  }

  private createTimelineObjectsForBreakerTransitionEffect(breakerActionMetadata: Tv2BreakerTransitionEffectActionMetadata): Tv2BlueprintTimelineObject[] {
    const breaker: Breaker = breakerActionMetadata.breaker
    const casparCgPreRollDuration: number = breakerActionMetadata.casparCgPreRollDuration

    const videoMixerTimelineEnable: TimelineEnable = {
      start: this.getTimeFromFrames(breaker.startAlpha) + casparCgPreRollDuration,
      duration: this.getTimeFromFrames(breaker.durationInFrames - breaker.startAlpha - breaker.endAlpha) + casparCgPreRollDuration
    }

    const videoMixerInputSource: number = breakerActionMetadata.downstreamKeyer.videoMixerFillSource
    const fileName: string = this.assetPathHelper.joinAssetToFolder(breakerActionMetadata.breaker.fileName, breakerActionMetadata.breakerFolder)

    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(videoMixerInputSource, videoMixerTimelineEnable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(videoMixerInputSource, videoMixerTimelineEnable),
      this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(breakerActionMetadata.downstreamKeyer, true),
      this.videoClipTimelineObjectFactory.createBreakerTimelineObject(fileName),
      this.audioTimelineObjectFactory.createBreakerAudioTimelineObject()
    ]
  }

  private createPartInTransitionForBreakerTransitionEffect(breakerActionMetadata: Tv2BreakerTransitionEffectActionMetadata): InTransition {
    return {
      keepPreviousPartAliveDuration: this.getTimeFromFrames(breakerActionMetadata.breaker.startAlpha) + breakerActionMetadata.casparCgPreRollDuration,
      delayPiecesDuration: this.getTimeFromFrames(breakerActionMetadata.breaker.durationInFrames - breakerActionMetadata.breaker.endAlpha) + breakerActionMetadata.casparCgPreRollDuration
    }
  }
}
