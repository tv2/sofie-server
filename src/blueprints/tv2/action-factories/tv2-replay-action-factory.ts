import { Action } from '../../../action-system/domain/entities/action'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithAudio } from '../value-objects/tv2-studio-blueprint-configuration'
import { PartActionType, PieceActionType } from '../../../action-system/domain/enums/action-type'
import { PartInterface } from '../../../rundown-execution/domain/entities/part'
import { Tv2ReplayAction, Tv2ReplayAuxAction } from '../value-objects/tv2-action'
import { Tv2PieceLayer, Tv2VideoMixerLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../rundown-execution/domain/enums/piece-lifespan'
import { TransitionType } from '../../../rundown-execution/domain/enums/transition-type'
import { Tv2BlueprintTimelineObject } from '../value-objects/tv2-blueprint-timeline-object'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../rundown-execution/domain/entities/timeline-enable'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { ActionFactory } from './action-factory'
import { AudioMode } from '../../../rundown-execution/domain/enums/audio-mode'
import { PieceMetadata } from '../../../rundown-execution/domain/value-objects/metadata'
import { OutputLayer } from '../../../rundown-execution/domain/enums/output-layer'
import { PlayoutContentType } from '../../../rundown-execution/domain/enums/playout-content-type'
import { OutputChannel } from '../../../rundown-execution/domain/enums/output-channel'

const EPSIO_REGEX: RegExp = /EPSIO/i

export class Tv2ReplayActionFactory extends ActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioMixerTimelineObjectFactory: Tv2AudioMixerTimelineObjectFactory
  ) {
    super()
  }

  public createReplayActions(configuration: Tv2BlueprintConfiguration): Action[] {
    return configuration.studio.replaySources.flatMap(replaySource => {
      const actions: Action[] = [
        this.createReplayActionWithVoiceOverAsNext(configuration, replaySource),
        this.createReplayActionWithVoiceOverAsOnAir(configuration, replaySource),
        this.createReplayStudioAuxAction(replaySource),
        this.createReplayVizAuxAction(replaySource)
      ]

      if (!EPSIO_REGEX.test(replaySource.name)) {
        actions.push(this.createReplayActionWithoutVoiceOverAsNext(configuration, replaySource))
        actions.push(this.createReplayActionWithoutVoiceOverAsOnAir(configuration, replaySource))
      }

      return actions
    })
  }

  private createReplayActionWithVoiceOverAsNext(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithAudio): Tv2ReplayAction {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    const partId: string = `${sanitizedId}_VO_as_next_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.name} VO`)
    const pieceInterface: Tv2PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, AudioMode.VOICE_OVER)

    return {
      id: `insert_${sanitizedId}_VO_as_next_part_action`,
      name: `${source.name} VO PVW`,
      rank: 0,
      description: '',
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface,
        pieceInterfaces: [
          pieceInterface
        ]
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputChannel: OutputChannel.PREVIEW
      }
    }
  }

  private createReplayActionWithVoiceOverAsOnAir(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithAudio): Tv2ReplayAction {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    const partId: string = `${sanitizedId}_VO_on_air_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.name} VO`)
    const pieceInterface: Tv2PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, AudioMode.VOICE_OVER)

    return {
      id: `insert_${sanitizedId}_VO_as_on_air_part_action`,
      name: `${source.name} VO PGM`,
      rank: 0,
      description: '',
      type: PartActionType.INSERT_PART_AS_ON_AIR,
      data: {
        partInterface,
        pieceInterfaces: [
          pieceInterface
        ]
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  }

  private createReplayActionWithoutVoiceOverAsNext(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithAudio): Tv2ReplayAction {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    const partId: string = `${sanitizedId}_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.name}`)
    const pieceInterface: Tv2PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, AudioMode.FULL)

    return {
      id: `insert_${sanitizedId}_as_next_part_action`,
      name: `${source.name} PVW`,
      rank: 0,
      description: '',
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface,
        pieceInterfaces: [
          pieceInterface
        ]
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputChannel: OutputChannel.PREVIEW
      }
    }
  }

  private createReplayActionWithoutVoiceOverAsOnAir(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithAudio): Tv2ReplayAction {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    const partId: string = `${sanitizedId}_on_air_part_action`
    const partInterface: PartInterface = this.createPartInterface(partId, `Replay Part ${source.name}`)
    const pieceInterface: Tv2PieceInterface = this.createReplayForSourcePieceInterface(configuration, partId, source, AudioMode.FULL)

    return {
      id: `insert_${sanitizedId}_as_on_air_part_action`,
      name: source.name,
      rank: 0,
      description: '',
      type: PartActionType.INSERT_PART_AS_ON_AIR,
      data: {
        partInterface,
        pieceInterfaces: [
          pieceInterface
        ]
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  }

  private createPartInterface(partId: string, name: string): PartInterface {
    return {
      id: partId,
      rundownId: '',
      name,
      segmentId: '',
      pieces: [],
      rank: -1,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      isUntimed: false,
      inTransition: {
        blockTakeDuration: 0,
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0
      },
      outTransition: {
        keepAliveDuration: 0
      },
      disableNextInTransition: false
    }
  }

  private createReplayForSourcePieceInterface(configuration: Tv2BlueprintConfiguration, parentPartId: string, source: Tv2SourceMappingWithAudio, audioMode: AudioMode): Tv2PieceInterface {
    const videoMixerEnable: TimelineEnable = {
      start: 0
    }

    const timelineObjects: Tv2BlueprintTimelineObject[] = [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(source.videoMixerSource, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(source.videoMixerSource, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(source.videoMixerSource, videoMixerEnable),
      ...this.audioMixerTimelineObjectFactory.createTimelineObjectsForSource(configuration, source, audioMode)
    ]

    const metadata: PieceMetadata = {
      playoutContent: {
        type: PlayoutContentType.REPLAY,
        source: source.name
      },
      outputLayer: OutputLayer.PROGRAM,
      audioMode: audioMode,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: audioMode === AudioMode.VOICE_OVER
      }
    }
    return {
      id: `replayAction_${this.sanitizeStringForId(source.name)}`,
      partId: parentPartId,
      rundownId: '',
      name: `${source.name}${audioMode === AudioMode.VOICE_OVER ? ' VO' : ''}`,
      layer: Tv2PieceLayer.REPLAY,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 0,
      takenOffAirTimestamp: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      metadata,
      tags: [],
      isUnsynced: false,
      timelineObjects
    }
  }

  private createReplayStudioAuxAction(source: Tv2SourceMappingWithAudio): Tv2ReplayAuxAction {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    return {
      id: `insert_studio_aux_${sanitizedId}_action`,
      name: `${source.name} Studio AUX`,
      rank: 0,
      description: '',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface: this.createStudioAuxPieceInterface(source),
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  }

  private createStudioAuxPieceInterface(source: Tv2SourceMappingWithAudio): Tv2PieceInterface {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    return {
      id: `insert_studio_aux_${sanitizedId}_piece`,
      name: `${source.name} Studio AUX`,
      partId: '',
      rundownId: '',
      layer: Tv2PieceLayer.REPLAY_STUDIO_AUXILIARY,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 0,
      takenOffAirTimestamp: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      isUnsynced: false,
      timelineObjects: [
        this.videoMixerTimelineObjectFactory.createAuxTimelineObject(source.videoMixerSource, Tv2VideoMixerLayer.AR)
      ],
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputLayer: OutputLayer.AUXILIARY
      }
    }
  }

  private createReplayVizAuxAction(source: Tv2SourceMappingWithAudio): Tv2ReplayAuxAction {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    return {
      id: `insert_viz_aux_${sanitizedId}_action`,
      name: `${source.name} Viz AUX`,
      rank: 0,
      description: '',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface: this.createVizAuxPieceInterface(source),
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  }

  private createVizAuxPieceInterface(source: Tv2SourceMappingWithAudio): Tv2PieceInterface {
    const sanitizedId: string = this.sanitizeStringForId(source.name)
    return {
      id: `insert_viz_aux_${sanitizedId}_piece`,
      name: `${source.name} Viz AUX`,
      partId: '',
      rundownId: '',
      layer: Tv2PieceLayer.REPLAY_VIZ_AUXILIARY,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 0,
      takenOffAirTimestamp: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      isUnsynced: false,
      timelineObjects: [
        this.videoMixerTimelineObjectFactory.createAuxTimelineObject(source.videoMixerSource, Tv2VideoMixerLayer.VIZ_OVERLAY_AUXILIARY)
      ],
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY,
          source: source.name
        },
        outputLayer: OutputLayer.AUXILIARY
      }
    }
  }
}
