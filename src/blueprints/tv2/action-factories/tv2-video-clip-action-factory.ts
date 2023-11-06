import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { PartActionType } from '../../../model/enums/action-type'
import { PartInterface } from '../../../model/entities/part'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2VideoClipManifestData } from '../value-objects/tv2-action-manifest-data'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Media } from '../../../model/entities/media'
import { Tv2ActionContentType, Tv2VideoClipAction } from '../value-objects/tv2-action'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2CasparCgTimelineObjectFactory } from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'

const A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE: number = -1
const VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX: string = 'videoClipAsNextAction'
const DEFAULT_EXPECTED_DURATION_IN_MS: number = 1000

export class Tv2VideoClipActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly casparCgTimelineObjectFactory: Tv2CasparCgTimelineObjectFactory
  ) {
  }

  public isVideoClipAction(action: Action): boolean {
    return action.id.includes(VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX)
  }

  public getMutateActionMethods(action: Action): MutateActionMethods[] {
    if (action.id.includes(VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX)) {
      return [{
        type: MutateActionType.MEDIA,
        getMediaId: () => action.name,
        updateActionWithMedia: (action: Action, media: Media | undefined) => this.updateVideoClipAction(action, media)
      }]
    }

    return []
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

  public createVideoClipActions(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipManifestData[]): Tv2VideoClipAction[] {
    return videoClipData.map(videoClip => this.createInsertVideoClipAsNextAction(configuration, videoClip))
  }

  private createInsertVideoClipAsNextAction(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipManifestData): Tv2VideoClipAction {
    const partId: string = 'videoClipInsertAction'
    const partInterface: PartInterface = this.createPartInterface(partId, videoClipData)
    return {
      id: `${VIDEO_CLIP_AS_NEXT_ACTION_ID_PREFIX}_${videoClipData.fileName}`,
      name: videoClipData.name,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface,
        pieceInterfaces: [
          this.createVideoClipPieceInterface(configuration, partId, videoClipData)
        ]
      },
      metadata: {
        contentType: Tv2ActionContentType.VIDEO_CLIP,
        fileName: videoClipData.fileName,
        configuredVideoClipPostrollDuration: configuration.studio.ServerPostrollDuration
      }
    }
  }

  private createVideoClipPieceInterface(configuration: Tv2BlueprintConfiguration, partId: string, videoClipData: Tv2VideoClipManifestData): PieceInterface {
    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.VIDEO_CLIP,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: videoClipData.adLibPix &&  videoClipData.isVoiceOver
      }
    }

    const videoMixerEnable: TimelineEnable = {
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
      isUnsynced: false,
      start: 0,
      duration: 0,
      preRollDuration: configuration.studio.CasparPrerollDuration,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoMixerEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoMixerEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(A_B_VIDEO_CLIP_PLACEHOLDER_SOURCE, videoMixerEnable),
        this.casparCgTimelineObjectFactory.createVideoClipTimelineObject(videoClipData),
        ...this.audioTimelineObjectFactory.createVideoClipAudioTimelineObjects(configuration, videoClipData)
      ]
    }
  }

  private createPartInterface(partId: string, videoClipData: Tv2VideoClipManifestData): PartInterface {
    return {
      id: partId,
      name: videoClipData.name,
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
      expectedDuration: videoClipData.durationFromIngest > 0 ? videoClipData.durationFromIngest : DEFAULT_EXPECTED_DURATION_IN_MS,
      disableNextInTransition: false
    }
  }
}
