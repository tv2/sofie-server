import { Action, MutateActionMethods, MutateActionType } from '../../../../action-system/domain/entities/action'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { PartActionType } from '../../../../action-system/domain/enums/action-type'
import { PartInterface } from '../../../../rundown-execution/domain/entities/part'
import { PieceLifespan } from '../../../../rundown-execution/domain/enums/piece-lifespan'
import { TransitionType } from '../../../../rundown-execution/domain/enums/transition-type'
import { Tv2PieceLayer } from '../../value-objects/tv2-layers'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-blueprint-timeline-object'
import { Tv2VideoClipManifestData } from '../../value-objects/tv2-action-manifest-data'
import { TimelineEnable } from '../../../../rundown-execution/domain/entities/timeline-enable'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import { Media } from '../../../../rundown-execution/domain/entities/media'
import { Tv2Action, Tv2VideoClipAction } from '../../value-objects/tv2-action'
import {
  Tv2VideoClipTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-clip-timeline-object-factory'
import { Tv2ActionManifestMapper } from '../tv2-action-manifest-mapper'
import { Tv2ActionManifest } from '../../value-objects/tv2-action-manifest'
import { Tv2PieceInterface } from '../../entities/tv2-piece-interface'
import { Tv2UnexpectedActionException } from '../../exceptions/tv2-unexpected-action-exception'
import { ActionFactory } from './action-factory'
import { PieceMetadata } from '../../../../rundown-execution/domain/value-objects/metadata'
import { OutputLayer } from '../../../../rundown-execution/domain/enums/output-layer'
import { AudioMode } from '../../../../rundown-execution/domain/enums/audio-mode'
import { PlayoutContentType } from '../../../../rundown-execution/domain/enums/playout-content-type'
import { OutputChannel } from '../../../../rundown-execution/domain/enums/output-channel'

const A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE: number = -1

export class Tv2VideoClipActionFactory extends ActionFactory {
  public constructor(
    private readonly actionManifestMapper: Tv2ActionManifestMapper,
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioMixerTimelineObjectFactory: Tv2AudioMixerTimelineObjectFactory,
    private readonly videoClipTimelineObjectFactory: Tv2VideoClipTimelineObjectFactory,
  ) {
    super()
  }

  public isVideoClipAction(action: Tv2Action): boolean {
    return [PlayoutContentType.VIDEO_CLIP].includes(action.metadata.playoutContent.type)
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    if (this.isVideoClipAction(action)) {
      return [{
        type: MutateActionType.MEDIA,
        getMediaSourceName: () => action.name,
        updateActionWithMedia: (action: Action, media: Media | undefined) => this.updateVideoClipAction(action, media)
      }]
    }
    return []
  }

  private updateVideoClipAction(action: Action, media?: Media): Action {
    const videoClipAction: Tv2VideoClipAction = action as Tv2VideoClipAction
    if (videoClipAction.metadata.playoutContent.type !== PlayoutContentType.VIDEO_CLIP) {
      throw new Tv2UnexpectedActionException(`Expected action with id '${videoClipAction.id}' to have a video clip content type instead of '${videoClipAction.metadata.playoutContent.type}'.`)
    }

    videoClipAction.data.partInterface.expectedDuration = media?.duration
      ? Math.max(media.duration * 1000 - videoClipAction.metadata.configuredVideoClipPostRollDuration, 0)
      : videoClipAction.data.partInterface.expectedDuration

    const mediaPlayerSession: string = `${action.id}_${Date.now()}`
    videoClipAction.data.pieceInterfaces.map((pieceInterface) => {
      pieceInterface.metadata.mediaPlayerSessions = [mediaPlayerSession]

      pieceInterface.timelineObjects.map((timelineObject) => {
        const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
        blueprintTimelineObject.metaData = {
          ...blueprintTimelineObject.metaData,
          mediaPlayerSession
        }
      })
    })

    return videoClipAction
  }

  public createVideoClipActions(configuration: Tv2BlueprintConfiguration, actionManifests: Tv2ActionManifest[]): Tv2VideoClipAction[] {
    const videoClipManifestData: Tv2VideoClipManifestData[] = this.actionManifestMapper.filterAndMapToVideoClipManifestData(actionManifests)
    return this.removeDuplicateActions(
      videoClipManifestData.map(videoClip => this.createInsertVideoClipAsNextAction(configuration, videoClip))
    )
  }

  private createInsertVideoClipAsNextAction(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipManifestData): Tv2VideoClipAction {
    const partId: string = 'videoClipInsertAction'
    const partInterface: PartInterface = this.createPartInterface(partId, videoClipData)
    return {
      id: this.sanitizeStringForId(`videoClipAsNextAction_${videoClipData.name}_${videoClipData.fileName}`), // TODO: Utilize information about the Segment once we control ingest
      name: videoClipData.name,
      rank: videoClipData.rank,
      rundownId: videoClipData.rundownId,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface,
        pieceInterfaces: [
          this.createVideoClipPieceInterface(configuration, partId, videoClipData)
        ]
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.VIDEO_CLIP
        },
        outputChannel: OutputChannel.PREVIEW,
        fileName: videoClipData.fileName,
        configuredVideoClipPostRollDuration: configuration.studio.serverPostRollDuration
      }
    }
  }

  private createVideoClipPieceInterface(configuration: Tv2BlueprintConfiguration, partId: string, videoClipData: Tv2VideoClipManifestData): Tv2PieceInterface {
    const metadata: PieceMetadata = {
      playoutContent: {
        type: PlayoutContentType.VIDEO_CLIP
      },
      outputLayer: OutputLayer.PROGRAM,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: videoClipData.adLibPix && videoClipData.audioMode === AudioMode.VOICE_OVER
      },
      sourceName: videoClipData.fileName
    }

    const videoMixerEnable: TimelineEnable = {
      start: configuration.studio.casparCgPreRollDuration
    }

    return {
      id: `videoClipActionPiece_${this.sanitizeStringForId(videoClipData.fileName)}`,
      partId,
      rundownId: '',
      name: videoClipData.fileName,
      layer: Tv2PieceLayer.VIDEO_CLIP,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      metadata,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      duration: 0,
      takenOffAirTimestamp: 0,
      preRollDuration: configuration.studio.casparCgPreRollDuration,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoMixerEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoMixerEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoMixerEnable),
        this.videoClipTimelineObjectFactory.createVideoClipTimelineObject(videoClipData),
        ...this.audioMixerTimelineObjectFactory.createVideoClipAudioTimelineObjects(configuration, videoClipData)
      ]
    }
  }

  private createPartInterface(partId: string, videoClipData: Tv2VideoClipManifestData): PartInterface {
    return {
      id: partId,
      rundownId: '',
      name: videoClipData.name,
      segmentId: '',
      pieces: [],
      rank: -1,
      isOnAir: false,
      isNext: false,
      isUntimed: false,
      isUnsynced: false,
      inTransition: {
        blockTakeDuration: 0,
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0
      },
      outTransition: {
        keepAliveDuration: 0
      },
      expectedDuration: videoClipData.durationFromIngest > 0 ? videoClipData.durationFromIngest : undefined,
      disableNextInTransition: false
    }
  }
}
