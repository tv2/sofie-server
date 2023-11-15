import { Action } from '../../../model/entities/action'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { PartInterface } from '../../../model/entities/part'
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
import { Tv2AudioMode } from '../enums/tv2-audio-mode'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'

const EPSIO_REGEX: RegExp = /EPSIO/i

export class Tv2ReplayActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {
  }

  public createReplayActions(configuration: Tv2BlueprintConfiguration): Action[] {
    return configuration.studio.replaySources.flatMap(replaySource => {
      const actions: Action[] = [
        this.createReplayActionWithVoiceOver(configuration, replaySource),
        this.createReplayStudioAuxAction(replaySource),
        this.createReplayVizAuxAction(replaySource)
      ]

      if (!EPSIO_REGEX.test(replaySource.name)) {
        actions.push(this.createReplayActionWithoutVoiceOver(configuration, replaySource))
      }

      return actions
    })
  }

  private createReplayActionWithVoiceOver(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound): Tv2ReplayAction {
    const noWhitespaceName: string = this.removeAllWhitespace(source.name)
    const partId: string = `${noWhitespaceName}_VO_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.name} VO`)
    const pieceInterface: Tv2PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, Tv2AudioMode.VOICE_OVER)

    return {
      id: `insert_${noWhitespaceName}_VO_as_next_part_action`,
      name: source.name,
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
    const noWhitespaceName: string = this.removeAllWhitespace(source.name)
    const partId: string = `${noWhitespaceName}_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.name}`)
    const pieceInterface: Tv2PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, Tv2AudioMode.FULL)

    return {
      id: `insert_${noWhitespaceName}_as_next_part_action`,
      name: source.name,
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

  private createReplayForSourcePieceInterface(configuration: Tv2BlueprintConfiguration, parentPartId: string, source: Tv2SourceMappingWithSound, audioMode: Tv2AudioMode): Tv2PieceInterface {
    const videoMixerEnable: TimelineEnable = {
      start: 0
    }

    const timelineObjects: TimelineObject[] = [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(source.videoMixerSource, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(source.videoMixerSource, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(source.videoMixerSource, videoMixerEnable),
      ...this.audioTimelineObjectFactory.createTimelineObjectsForSource(configuration, source, audioMode)
    ]

    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.REPLAY,
      outputLayer: Tv2OutputLayer.PROGRAM,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: audioMode == Tv2AudioMode.VOICE_OVER
      }
    }
    return {
      id: `replayAction_${this.removeAllWhitespace(source.name)}`,
      partId: parentPartId,
      name: `${source.name}${audioMode ? ' VO' : ''}`,
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
    const noWhitespaceName: string = this.removeAllWhitespace(source.name)
    return {
      id: `insert_studio_aux_${noWhitespaceName}_action`,
      name: `${source.name} Studio AUX`,
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

  private createStudioAuxPieceInterface(source: Tv2SourceMappingWithSound): Tv2PieceInterface {
    const noWhitespaceName: string = this.removeAllWhitespace(source.name)
    return {
      id: `insert_studio_aux_${noWhitespaceName}_piece`,
      name: `${source.name} Studio AUX`,
      partId: '',
      layer: Tv2SourceLayer.REPLAY_STUDIO_AUXILIARY,
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
        this.videoMixerTimelineObjectFactory.createAuxTimelineObject(source.videoMixerSource, Tv2VideoMixerLayer.AR)
      ],
      metadata: {
        type: Tv2PieceType.REPLAY,
        outputLayer: Tv2OutputLayer.AUXILIARY
      }
    }
  }

  private createReplayVizAuxAction(source: Tv2SourceMappingWithSound): Tv2ReplayAuxAction {
    const noWhitespaceName: string = this.removeAllWhitespace(source.name)
    return {
      id: `insert_viz_aux_${noWhitespaceName}_action`,
      name: `${source.name} Viz AUX`,
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

  private createVizAuxPieceInterface(source: Tv2SourceMappingWithSound): Tv2PieceInterface {
    const noWhitespaceName: string = this.removeAllWhitespace(source.name)
    return {
      id: `insert_viz_aux_${noWhitespaceName}_piece`,
      name: `${source.name} Viz AUX`,
      partId: '',
      layer: Tv2SourceLayer.REPLAY_VIZ_AUXILIARY,
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
        this.videoMixerTimelineObjectFactory.createAuxTimelineObject(source.videoMixerSource, Tv2VideoMixerLayer.VIZ_OVERLAY_AUXILIARY)
      ],
      metadata: {
        type: Tv2PieceType.REPLAY,
        outputLayer: Tv2OutputLayer.AUXILIARY
      }
    }
  }
}
