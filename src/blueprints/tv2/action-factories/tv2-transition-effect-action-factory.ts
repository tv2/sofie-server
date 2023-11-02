import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { PieceActionType } from '../../../model/enums/action-type'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { Tv2AtemLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TimelineObject } from '../../../model/entities/timeline-object'
import {
  Tv2ActionContentType,
  Tv2BreakerTransitionEffectActionMetadata,
  Tv2CutTransitionEffectActionMetadata,
  Tv2DipTransitionEffectActionMetadata,
  Tv2MixTransitionEffectActionMetadata,
  Tv2PartAction,
  Tv2PieceAction,
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
import { Tv2CasparCgTimelineObjectFactory } from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import { Tv2DownstreamKeyer, Tv2DownstreamKeyerRole } from '../value-objects/tv2-studio-blueprint-configuration'
import { AssetFolderHelper } from '../helpers/AssetFolderHelper'

const FRAME_RATE: number = 25
const MINIMUM_DURATION_IN_MS: number = 1000

export class Tv2TransitionEffectActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly casparCgTimelineObjectFactory: Tv2CasparCgTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly assetFolderHelper: AssetFolderHelper
  ) {
  }

  public createTransitionEffectActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return blueprintConfiguration.showStyle.transitionEffectConfigurations.map(transitionEffect => {
      switch (transitionEffect.type) {
        case TransitionEffectType.CUT: {
          return this.createCutTransitionEffectOnNextTakeAction()
        }
        case TransitionEffectType.MIX: {
          return this.createMixTransitionEffectOnNextTakeAction(transitionEffect)
        }
        case TransitionEffectType.DIP: {
          return this.createDipTransitionEffectOnNextTakeAction(transitionEffect, blueprintConfiguration.studio.SwitcherSource.Dip)
        }
        case TransitionEffectType.BREAKER: {
          return this.createBreakerTransitionEffectOnNextTakeAction(transitionEffect, blueprintConfiguration)
        }
      }
    })
  }

  public isTransitionEffectAction(action: Action): boolean {
    const tv2Action: Tv2PartAction | Tv2PieceAction = action as Tv2PartAction | Tv2PieceAction
    return [Tv2ActionContentType.TRANSITION].includes(tv2Action.metadata.contentType)
  }

  public getMutateActionMethods(action: Action): MutateActionMethods[] {
    const tv2Action: Tv2PartAction | Tv2PieceAction = action as Tv2PartAction | Tv2PieceAction
    switch (tv2Action.metadata.contentType) {
      case Tv2ActionContentType.TRANSITION: {
        return [{
          type: MutateActionType.PIECE,
          updateActionWithPieceData: (action: Action, piece: Piece) => this.updateTimelineObjectsWithTransitionEffect(action as Tv2TransitionEffectAction, piece),
          piecePredicate: (piece: Piece) => piece.timelineObjects.some(timelineObject => timelineObject.layer === Tv2AtemLayer.PROGRAM),
        }]
      }
    }
    return []
  }

  private createCutTransitionEffectOnNextTakeAction(): Tv2TransitionEffectAction {
    const effectName: string = 'Cut'
    const pieceInterface: PieceInterface = this.createPieceInterface(effectName, 0)
    const metadata: Tv2CutTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.CUT
    }
    return this.createTransitionEffectAction(effectName, metadata, pieceInterface)
  }

  private createPieceInterface(effectName: string, durationFrames: number): PieceInterface {
    return {
      id: `${effectName}TransitionActionPiece`,
      name: `${effectName} transition`,
      partId: '',
      type: PieceType.TRANSITION,
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
      timelineObjects: []
    }
  }

  private getTimeFromFrames(frames: number): number {
    return (1000 / FRAME_RATE) * frames
  }

  private createTransitionEffectAction(effectName: string, metadata: Tv2TransitionEffectActionMetadata, pieceInterface: PieceInterface): Tv2TransitionEffectAction {
    return {
      id: `nextTakeHas${effectName}TransitionAction`,
      name: `${effectName}`,
      description: `${effectName} transition on next Take.`,
      type: PieceActionType.INSERT_PIECE_AS_NEXT,
      data: {
        pieceInterface
      },
      metadata
    }
  }

  private createMixTransitionEffectOnNextTakeAction(transitionEffect: MixTransitionEffect): Tv2TransitionEffectAction {
    const effectName: string = `Mix${transitionEffect.durationInFrames}`
    const pieceInterface: PieceInterface = this.createPieceInterface(effectName, transitionEffect.durationInFrames)
    const metadata: Tv2MixTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.MIX,
      durationInFrames: transitionEffect.durationInFrames
    }
    return this.createTransitionEffectAction(effectName, metadata, pieceInterface)
  }

  private createDipTransitionEffectOnNextTakeAction(transitionEffect: DipTransitionEffect, configuredDipInput: number): Tv2TransitionEffectAction {
    const effectName: string = `Dip${transitionEffect.durationInFrames}`
    const pieceInterface: PieceInterface = this.createPieceInterface(effectName, transitionEffect.durationInFrames)
    const metadata: Tv2DipTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.DIP,
      durationInFrames: transitionEffect.durationInFrames,
      dipInput: configuredDipInput
    }
    return this.createTransitionEffectAction(effectName, metadata, pieceInterface)
  }

  private createBreakerTransitionEffectOnNextTakeAction(transitionEffect: BreakerTransitionEffect, configuration: Tv2BlueprintConfiguration): Tv2TransitionEffectAction {
    const breaker: Breaker | undefined = configuration.showStyle.breakers.find(breaker => breaker.name === transitionEffect.name)
    if (!breaker) {
      throw new Tv2MisconfigurationException(`Can't create Transition Effect Action for ${transitionEffect.name}. ${transitionEffect.name} is missing in Configurations`)
    }

    const breakerDsk: Tv2DownstreamKeyer | undefined = configuration.studio.SwitcherSource.DSK.find(dsk => dsk.Roles.includes(Tv2DownstreamKeyerRole.JINGLE))
    if (!breakerDsk) {
      throw  new Tv2MisconfigurationException('Can\'t create Transition Effect Action. No DSK has been configured for Jingles.')
    }

    const pieceInterface: PieceInterface = this.createPieceInterface(breaker.name, breaker.durationInFrames)
    const metadata: Tv2BreakerTransitionEffectActionMetadata = {
      contentType: Tv2ActionContentType.TRANSITION,
      transitionEffectType: TransitionEffectType.BREAKER,
      casparCgPreRollDuration: configuration.studio.CasparPrerollDuration,
      downstreamKeyer: breakerDsk,
      breakerFolder: configuration.studio.JingleFolder ?? '',
      breaker
    }
    return this.createTransitionEffectAction(breaker.name, metadata, pieceInterface)
  }

  private updateTimelineObjectsWithTransitionEffect(action: Tv2TransitionEffectAction, piece: Piece): Tv2TransitionEffectAction {
    const sourceInput: number | undefined = this.videoMixerTimelineObjectFactory.findProgramSourceInputFromPiece(piece)
    if (!sourceInput) {
      console.log('Can\'t find a Program SourceInput to put the Transition Effect on')
      return action
    }

    switch (action.metadata.transitionEffectType) {
      case TransitionEffectType.CUT: {
        const cutTransitionTimelineObject: TimelineObject = this.videoMixerTimelineObjectFactory.createCutTransitionEffectTimelineObject(sourceInput)
        action.data.pieceInterface.timelineObjects.push(cutTransitionTimelineObject)
        break
      }
      case TransitionEffectType.MIX: {
        const mixTransitionTimelineObject: TimelineObject = this.videoMixerTimelineObjectFactory.createMixTransitionEffectTimelineObject(sourceInput, action.metadata.durationInFrames)
        action.data.pieceInterface.timelineObjects.push(mixTransitionTimelineObject)
        break
      }
      case TransitionEffectType.DIP: {
        const dipTransitionTimelineObject: TimelineObject = this.videoMixerTimelineObjectFactory.createDipTransitionEffectTimelineObject(sourceInput, action.metadata.durationInFrames, action.metadata.dipInput)
        action.data.pieceInterface.timelineObjects.push(dipTransitionTimelineObject)
        break
      }
      case TransitionEffectType.BREAKER: {
        const breaker: Breaker = action.metadata.breaker
        const casparCgPreRollDuration: number = action.metadata.casparCgPreRollDuration

        const videoMixerTimelineEnable: TimelineEnable = {
          start: this.getTimeFromFrames(breaker.startAlpha) + casparCgPreRollDuration,
          duration: this.getTimeFromFrames(breaker.durationInFrames - breaker.startAlpha - breaker.endAlpha) + casparCgPreRollDuration
        }

        const videoMixerInputSource: number = action.metadata.downstreamKeyer.Fill
        const fileName: string = this.assetFolderHelper.joinAssetToFolder(action.metadata.breakerFolder, action.metadata.breaker.fileName)

        const timelineObjects: TimelineObject[] = [
          this.videoMixerTimelineObjectFactory.createProgramTimelineObject(videoMixerInputSource, videoMixerTimelineEnable),
          this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(videoMixerInputSource, videoMixerTimelineEnable),
          this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(action.metadata.downstreamKeyer, true),
          this.casparCgTimelineObjectFactory.createBreakerTimelineObject(fileName),
          this.audioTimelineObjectFactory.createBreakerAudioTimelineObject()
        ]

        action.data.pieceInterface.timelineObjects.push(...timelineObjects)
        action.data.partInTransition = {
          keepPreviousPartAliveDuration: this.getTimeFromFrames(breaker.startAlpha) + casparCgPreRollDuration,
          delayPiecesDuration: this.getTimeFromFrames(breaker.durationInFrames - breaker.endAlpha) + casparCgPreRollDuration
        }
        break
      }
    }

    return action
  }
}
