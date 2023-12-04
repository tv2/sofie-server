import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { PieceActionType } from '../../../model/enums/action-type'
import { Piece } from '../../../model/entities/piece'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { Tv2AtemLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import {
  Tv2Action,
  Tv2ActionContentType,
  Tv2BreakerTransitionEffectActionMetadata,
  Tv2CutTransitionEffectActionMetadata,
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
  DipTransitionEffect,
  MixTransitionEffect,
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
    return blueprintConfiguration.showStyle.transitionEffectConfigurations.flatMap(transitionEffect => {
      switch (transitionEffect.type) {
        case TransitionEffectType.CUT: {
          return [
            this.createCutTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT),
            this.createCutTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE)
          ]
        }
        case TransitionEffectType.MIX: {
          return [
            this.createMixTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT, transitionEffect),
            this.createMixTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE, transitionEffect)
          ]
        }
        case TransitionEffectType.DIP: {
          return [
            this.createDipTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT, transitionEffect, blueprintConfiguration.studio.videoMixerBasicConfiguration.dipVideoMixerSource),
            this.createDipTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE, transitionEffect, blueprintConfiguration.studio.videoMixerBasicConfiguration.dipVideoMixerSource)
          ]
        }
        case TransitionEffectType.BREAKER: {
          return [
            this.createBreakerTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT, transitionEffect, blueprintConfiguration),
            this.createBreakerTransitionEffectAction(PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE, transitionEffect, blueprintConfiguration)
          ]
        }
      }
    })
  }

  public isTransitionEffectAction(action: Tv2Action): boolean {
    return [Tv2ActionContentType.TRANSITION].includes(action.metadata.contentType)
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    switch (action.metadata.contentType) {
      case Tv2ActionContentType.TRANSITION: {
        return [{
          type: MutateActionType.PIECE,
          updateActionWithPiece: (action: Action, piece: Piece) => this.updateTimelineObjectsWithTransitionEffect(action as Tv2TransitionEffectAction, piece),
          piecePredicate: (piece: Piece) => piece.timelineObjects.some(timelineObject => timelineObject.layer === Tv2AtemLayer.PROGRAM),
        }]
      }
    }
    return []
  }

  private createCutTransitionEffectAction(actionType: PieceActionType): Tv2TransitionEffectAction {
    const effectName: string = 'Cut'
    const pieceInterface: Tv2PieceInterface = this.createPieceInterface(effectName, 0)
    const metadata: Tv2CutTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.CUT
    }
    return this.createTransitionEffectAction(actionType, effectName, metadata, pieceInterface)
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
      name: `${effectName}`,
      description: `${effectName} transition on next Take.`,
      type: actionType,
      data: {
        pieceInterface
      },
      metadata
    }
  }

  private createMixTransitionEffectAction(actionType: PieceActionType, transitionEffect: MixTransitionEffect): Tv2TransitionEffectAction {
    const effectName: string = `Mix${transitionEffect.durationInFrames}`
    const pieceInterface: Tv2PieceInterface = this.createPieceInterface(effectName, transitionEffect.durationInFrames)
    const metadata: Tv2MixTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.MIX,
      durationInFrames: transitionEffect.durationInFrames
    }
    return this.createTransitionEffectAction(actionType, effectName, metadata, pieceInterface)
  }

  private createDipTransitionEffectAction(actionType: PieceActionType, transitionEffect: DipTransitionEffect, configuredDipInput: number): Tv2TransitionEffectAction {
    const effectName: string = `Dip${transitionEffect.durationInFrames}`
    const pieceInterface: Tv2PieceInterface = this.createPieceInterface(effectName, transitionEffect.durationInFrames)
    const metadata: Tv2DipTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.DIP,
      durationInFrames: transitionEffect.durationInFrames,
      dipInput: configuredDipInput
    }
    return this.createTransitionEffectAction(actionType, effectName, metadata, pieceInterface)
  }

  private createBreakerTransitionEffectAction(actionType: PieceActionType, transitionEffect: BreakerTransitionEffect, configuration: Tv2BlueprintConfiguration): Tv2TransitionEffectAction {
    const breaker: Breaker | undefined = configuration.showStyle.breakers.find(breaker => breaker.name === transitionEffect.name)
    if (!breaker) {
      throw new Tv2MisconfigurationException(`Can't create Transition Effect Action for ${transitionEffect.name}. ${transitionEffect.name} is missing in Configurations`)
    }

    const breakerDsk: Tv2DownstreamKeyer | undefined = configuration.studio.videoMixerBasicConfiguration.downstreamKeyers.find(dsk => dsk.roles.includes(Tv2DownstreamKeyerRole.JINGLE))
    if (!breakerDsk) {
      throw  new Tv2MisconfigurationException('Can\'t create Transition Effect Action. No DSK has been configured for Jingles.')
    }

    const pieceInterface: Tv2PieceInterface = this.createPieceInterface(breaker.name, breaker.durationInFrames)
    const metadata: Tv2BreakerTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.BREAKER,
      casparCgPreRollDuration: configuration.studio.casparCgPreRollDuration,
      downstreamKeyer: breakerDsk,
      breakerFolder: configuration.studio.jingleFolder?.name ?? '',
      breaker
    }
    return this.createTransitionEffectAction(actionType, breaker.name, metadata, pieceInterface)
  }

  private updateTimelineObjectsWithTransitionEffect(action: Tv2TransitionEffectAction, piece: Piece): Tv2TransitionEffectAction {
    const sourceInput: number | undefined = this.videoMixerTimelineObjectFactory.findProgramSourceInputFromPiece(piece)
    if (!sourceInput) {
      this.logger.warn('Can\'t find a Program SourceInput to put the Transition Effect on')
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
