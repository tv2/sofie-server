import { PieceInterface } from '../../../model/entities/piece'
import { PartInterface } from '../../../model/entities/part'
import { PartActionType } from '../../../model/enums/action-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2ActionContentType, Tv2RemoteAction } from '../value-objects/tv2-action'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'

export class Tv2RemoteActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {}

  public createRemoteActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2RemoteAction[] {
    return blueprintConfiguration.studio.remoteSources
      .map(source => this.createInsertRemoteAsNextAction(blueprintConfiguration, source))
  }

  private createInsertRemoteAsNextAction(configuration: Tv2BlueprintConfiguration, remoteSource: Tv2SourceMappingWithSound): Tv2RemoteAction {
    const partId: string = `remoteInsertActionPart_${remoteSource.id}`
    const remotePieceInterface: PieceInterface = this.createRemotePiece(configuration, remoteSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, remoteSource)
    return {
      id: `remoteAsNextAction_${remoteSource.id}`,
      name: `LIVE ${remoteSource.name}`,
      description: `Insert LIVE ${remoteSource.name} as next.`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [remotePieceInterface]
      },
      metadata: {
        contentType: Tv2ActionContentType.REMOTE,
        remoteNumber: remoteSource.name,
      },
    }
  }

  private createRemotePiece(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, parentPartId: string): PieceInterface {
    const videoMixerTimelineObjects: TimelineObject[] = this.createVideoMixerTimelineObjects(source)
    const audioTimelineObjects: TimelineObject[] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(configuration, source)

    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.REMOTE,
      sisyfosPersistMetaData: {
        sisyfosLayers: source.sisyfosLayers,
        wantsToPersistAudio: source.wantsToPersistAudio,
        acceptsPersistedAudio: source.acceptPersistAudio
      }
    }

    return {
      id: `remoteAction_${source.id}`,
      partId: parentPartId,
      name: `LIVE ${source.name}`,
      layer: Tv2SourceLayer.REMOTE,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      metadata,
      tags: [],
      isUnsynced: false,
      timelineObjects: [
        ...videoMixerTimelineObjects,
        ...audioTimelineObjects
      ]
    }
  }

  private createVideoMixerTimelineObjects(source: Tv2SourceMappingWithSound): TimelineObject[] {
    const enable: TimelineEnable = { start: 0 }
    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(source.videoMixerSource, enable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(source.videoMixerSource, enable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(source.videoMixerSource, enable),
    ]
  }

  private createPartInterface(partId: string, source: Tv2SourceMappingWithSound): PartInterface {
    return {
      id: partId,
      name: `Live Part ${source.name}`,
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
}
