import { Action } from '../../../model/entities/action'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { PartInterface } from '../../../model/entities/part'
import { PieceInterface } from '../../../model/entities/piece'
import { Tv2ActionContentType, Tv2ReplayAction, Tv2ReplayAuxAction } from '../value-objects/tv2-action'
import { Tv2SourceLayer, Tv2VideoMixerLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { TimelineObject } from '../../../model/entities/timeline-object'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import { Tv2AudioLevel } from '../enums/tv2-audio-level'

const EPSIO_REGEX: RegExp = /EPSIO/i

export class Tv2ReplayActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {
  }

  public createReplayActions(configuration: Tv2BlueprintConfiguration): Action[] {
    return configuration.studio.SourcesReplay.flatMap(replaySource => {
      const actions: Action[] = [
        this.createReplayActionWithVoiceOver(configuration, replaySource),
        this.createReplayStudioAuxAction(replaySource),
        this.createReplayVizAuxAction(replaySource)
      ]

      if (!EPSIO_REGEX.test(replaySource.SourceName)) {
        actions.push(this.createReplayActionWithoutVoiceOver(configuration, replaySource))
      }

      return actions
    })
  }

  private createReplayActionWithVoiceOver(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound): Tv2ReplayAction {
    const noWhitespaceName: string = this.removeAllWhitespace(source.SourceName)
    const partId: string = `${noWhitespaceName}_VO_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.SourceName} VO`)
    const pieceInterface: PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, Tv2AudioLevel.VOICE_OVER)

    return {
      id: `insert_${noWhitespaceName}_VO_as_next_part_action`,
      name: source.SourceName,
      description: '',
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface,
        pieceInterfaces: [
          pieceInterface
        ]
      },
      metadata: {
        contentType: Tv2ActionContentType.REPLAY
      }
    }
  }

  private removeAllWhitespace(value: string): string {
    return value.replace(' ', '')
  }

  private createReplayActionWithoutVoiceOver(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound): Tv2ReplayAction {
    const noWhitespaceName: string = this.removeAllWhitespace(source.SourceName)
    const partId: string = `${noWhitespaceName}_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.SourceName}`)
    const pieceInterface: PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, Tv2AudioLevel.FULL)

    return {
      id: `insert_${noWhitespaceName}_as_next_part_action`,
      name: source.SourceName,
      description: '',
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface,
        pieceInterfaces: [
          pieceInterface
        ]
      },
      metadata: {
        contentType: Tv2ActionContentType.REPLAY
      }
    }
  }

  private createPartInterface(partId: string, name: string): PartInterface {
    return {
      id: partId,
      name,
      segmentId: '',
      pieces: [],
      rank: -1,
      isPlanned: false,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      inTransition: {
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0
      },
      outTransition: {
        keepAliveDuration: 0
      },
      disableNextInTransition: false
    }
  }

  private createReplayForSourcePieceInterface(configuration: Tv2BlueprintConfiguration, parentPartId: string, source: Tv2SourceMappingWithSound, audioLevel: Tv2AudioLevel): PieceInterface {
    const videoMixerEnable: TimelineEnable = {
      start: 0
    }

    const timelineObjects: TimelineObject[] = [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(source.SwitcherSource, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(source.SwitcherSource, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(source.SwitcherSource, videoMixerEnable),
      ...this.audioTimelineObjectFactory.createTimelineObjectsForSource(configuration, source, audioLevel)
    ]

    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.REPLAY,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: audioLevel == Tv2AudioLevel.VOICE_OVER
      }
    }
    return {
      id: `replayAction_${this.removeAllWhitespace(source.SourceName)}`,
      partId: parentPartId,
      name: `${source.SourceName}${audioLevel ? ' VO' : ''}`,
      layer: Tv2SourceLayer.REPLAY,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      metadata,
      tags: [],
      isUnsynced: false,
      timelineObjects
    }
  }

  private createReplayStudioAuxAction(source: Tv2SourceMappingWithSound): Tv2ReplayAuxAction {
    const noWhitespaceName: string = this.removeAllWhitespace(source.SourceName)
    return {
      id: `insert_studio_aux_${noWhitespaceName}_action`,
      name: `${source.SourceName} Studio AUX`,
      description: '',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface: this.createStudioAuxPieceInterface(source),
      },
      metadata: {
        contentType: Tv2ActionContentType.REPLAY
      }
    }
  }

  private createStudioAuxPieceInterface(source: Tv2SourceMappingWithSound): PieceInterface {
    const noWhitespaceName: string = this.removeAllWhitespace(source.SourceName)
    return {
      id: `insert_studio_aux_${noWhitespaceName}_piece`,
      name: `${source.SourceName} Studio AUX`,
      partId: '',
      layer: Tv2SourceLayer.REPLAY_STUDIO_AUX,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      isUnsynced: false,
      timelineObjects: [
        this.videoMixerTimelineObjectFactory.createAuxTimelineObject(source.SwitcherSource, Tv2VideoMixerLayer.AR)
      ]
    }
  }

  private createReplayVizAuxAction(source: Tv2SourceMappingWithSound): Tv2ReplayAuxAction {
    const noWhitespaceName: string = this.removeAllWhitespace(source.SourceName)
    return {
      id: `insert_viz_aux_${noWhitespaceName}_action`,
      name: `${source.SourceName} Viz AUX`,
      description: '',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface: this.createVizAuxPieceInterface(source),
      },
      metadata: {
        contentType: Tv2ActionContentType.REPLAY
      }
    }
  }

  private createVizAuxPieceInterface(source: Tv2SourceMappingWithSound): PieceInterface {
    const noWhitespaceName: string = this.removeAllWhitespace(source.SourceName)
    return {
      id: `insert_viz_aux_${noWhitespaceName}_piece`,
      name: `${source.SourceName} Viz AUX`,
      partId: '',
      layer: Tv2SourceLayer.REPLAY_VIZ_AUX,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      isUnsynced: false,
      timelineObjects: [
        this.videoMixerTimelineObjectFactory.createAuxTimelineObject(source.SwitcherSource, Tv2VideoMixerLayer.VIZ_OVL_AUX)
      ]
    }
  }
}
