import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { PartActionType } from '../../../model/enums/action-type'
import { PartInterface } from '../../../model/entities/part'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2CasparCgLayer, Tv2VideoClipLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2VideoClipData } from '../value-objects/tv2-video-clip-data'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import { CasparCgMediaTimelineObject, CasparCgType } from '../../timeline-state-resolver-types/caspar-cg-types'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Media } from '../../../model/entities/media'
import { Tv2ActionContentType, Tv2VideoClipAction } from '../value-objects/tv2-action'

const A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE: number = -1
const VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX: string = 'videoClipAsNextAction'
const DEFAULT_EXPECTED_DURATION_IN_MS: number = 1000

export class Tv2VideoClipActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {
  }

  public isVideoClipAction(action: Action): boolean {
    return action.id.includes(VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX)
  }

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    if (action.id.includes(VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX)) {
      return {
        type: MutateActionType.MEDIA,
        getMediaId: () => action.name,
        updateActionWithMedia: (action, media) => this.updateVideoClipAction(action, media)
      }
    }
  }

  private updateVideoClipAction(action: Action, media?: Media): Action {
    const videoClipAction: Tv2VideoClipAction = action as Tv2VideoClipAction
    if (videoClipAction.metadata.contentType !== Tv2ActionContentType.VIDEO_CLIP) {
      console.error('Can\'t update VideoClipAction. Action is not a VideoClipAction')
      return action
    }

    videoClipAction.data.partInterface.expectedDuration = media?.duration
      ? Math.max((media.duration * 1000) - videoClipAction.metadata.configuredVideoClipPostrollDuration, 0)
      : videoClipAction.data.partInterface.expectedDuration

    const mediaPlayerSession: string = `${action.id}_${Date.now()}`
    videoClipAction.data.pieceInterfaces.map(pieceInterface => pieceInterface.timelineObjects.map(timelineObject => {
      const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
      blueprintTimelineObject.metaData = {
        ...blueprintTimelineObject.metaData,
        mediaPlayerSession
      }
    }))

    return videoClipAction
  }

  public createVideoClipActions(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipData[]): Tv2VideoClipAction[] {
    return videoClipData.map(server => this.createInsertVideoClipAsNextAction(configuration, server))
  }

  private createInsertVideoClipAsNextAction(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipData): Tv2VideoClipAction {
    const partId: string = 'serverInsertAction'
    const partInterface: PartInterface = this.createPartInterface(partId, videoClipData)
    return {
      id: `${VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX}_${videoClipData.fileName}`,
      name: videoClipData.name,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface,
        pieceInterfaces: [
          this.createProgramPieceInterface(configuration, partId, videoClipData)
        ]
      },
      metadata: {
        contentType: Tv2ActionContentType.VIDEO_CLIP,
        fileName: videoClipData.fileName,
        configuredVideoClipPostrollDuration: configuration.studio.ServerPostrollDuration
      }
    }
  }

  private createProgramPieceInterface(configuration: Tv2BlueprintConfiguration, partId: string, videoClipData: Tv2VideoClipData): PieceInterface {
    const metadata: Tv2PieceMetadata = {
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: videoClipData.adLibPix &&  videoClipData.isVoiceOver
      }
    }

    const videoSwitcherEnable: TimelineEnable = {
      start: configuration.studio.CasparPrerollDuration
    }

    return {
      id: `videoClipActionPiece_${videoClipData.fileName}`,
      partId,
      name: videoClipData.name,
      type: PieceType.VIDEO_CLIP,
      layer: Tv2SourceLayer.VIDEO_CLIP,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      metadata,
      isPlanned: false,
      start: 0,
      duration: 0,
      preRollDuration: configuration.studio.CasparPrerollDuration,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [
        this.createEnableServerTimelineObject(),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoSwitcherEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoSwitcherEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoSwitcherEnable),
        this.createCasparCgServerTimelineObject(videoClipData),
        ...this.audioTimelineObjectFactory.createVideoClipAudioTimelineObjects(configuration, videoClipData)
      ]
    }
  }

  private createEnableServerTimelineObject(): Tv2BlueprintTimelineObject {
    // TODO: Can this be removed?
    return {
      id: 'video_clip_enable',
      enable: {
        start: 0
      },
      layer: Tv2VideoClipLayer.VIDEO_CLIP_ENABLE_PENDING,
      content: {
        deviceType: DeviceType.ABSTRACT,
        type: 'empty'
      }
    }
  }

  private createCasparCgServerTimelineObject(videoClipData: Tv2VideoClipData): CasparCgMediaTimelineObject {
    return {
      id: `casparCg_${videoClipData.fileName}`,
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.PLAYER_CLIP_PENDING,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file: videoClipData.fileName,
        loop: videoClipData.adLibPix,
        playing: true,
        noStarttime: true
      }
    }
  }

  private createPartInterface(partId: string, videoClipData: Tv2VideoClipData): PartInterface {
    return {
      id: partId,
      name: videoClipData.name,
      segmentId: '',
      pieces: [],
      rank: -1,
      isPlanned: false,
      isOnAir: false,
      isNext: false,
      inTransition: {
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0
      },
      outTransition: {
        keepAliveDuration: 0
      },
      expectedDuration: videoClipData.durationFromIngest > 0 ? videoClipData.durationFromIngest : DEFAULT_EXPECTED_DURATION_IN_MS,
      disableNextInTransition: false
    }
  }
}
