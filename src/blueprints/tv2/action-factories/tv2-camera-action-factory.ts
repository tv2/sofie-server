import { PartInterface } from '../../../model/entities/part'
import { PartActionType } from '../../../model/enums/action-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2ActionContentType, Tv2CameraAction } from '../value-objects/tv2-action'
import { Action } from '../../../model/entities/action'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'

export class Tv2CameraActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {}

  public createCameraActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return blueprintConfiguration.studio.cameraSources
      .slice(0, 5)
      .flatMap(source => [
        this.createInsertCameraAsNextAction(blueprintConfiguration, source),
        this.createInsertCameraAsOnAirAction(blueprintConfiguration, source)
      ])
  }

  private createInsertCameraAsNextAction(configuration: Tv2BlueprintConfiguration, cameraSource: Tv2SourceMappingWithSound): Tv2CameraAction {
    const partId: string = `cameraInsertActionPart_${cameraSource.id}`
    const cameraPieceInterface: Tv2PieceInterface = this.createCameraPieceInterface(configuration, cameraSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, cameraSource)
    return {
      id: `cameraAsNextAction_${cameraSource.id}`,
      name: `KAM ${cameraSource.name} PVW`,
      rank: 0,
      description: `Insert Camera ${cameraSource.name} as next.`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [cameraPieceInterface]
      }, metadata: {
        contentType: Tv2ActionContentType.CAMERA,
        cameraNumber: cameraSource.name,
      },
    }
  }

  private createCameraPieceInterface(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, parentPartId: string): Tv2PieceInterface {
    const videoMixerTimelineObjects: Tv2BlueprintTimelineObject[] = this.createVideoMixerTimelineObjects(source)
    const audioTimelineObjects: Tv2BlueprintTimelineObject[] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(configuration, source)

    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.CAMERA,
      outputLayer: Tv2OutputLayer.PROGRAM,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: source.acceptPersistAudio
      }
    }

    return {
      id: `cameraAction_${source.id}`,
      partId: parentPartId,
      name: `KAM ${source.name}`,
      layer: Tv2SourceLayer.CAMERA,
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

  private createVideoMixerTimelineObjects(source: Tv2SourceMappingWithSound): Tv2BlueprintTimelineObject[] {
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
      rundownId: '',
      name: `Camera Part ${source.name}`,
      segmentId: '',
      pieces: [],
      rank: -1,
      isOnAir: false,
      isNext: false,
      isUntimed: false,
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

  public createInsertCameraAsOnAirAction(configuration: Tv2BlueprintConfiguration, cameraSource: Tv2SourceMappingWithSound): Tv2CameraAction {
    const partId: string = `cameraInsertAndTakeActionPart_${cameraSource.id}`
    const cameraPieceInterface: Tv2PieceInterface = this.createCameraPieceInterface(configuration, cameraSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, cameraSource)
    return {
      id: `cameraAsOnAirAction_${cameraSource.id}`,
      name: `KAM ${cameraSource.name} PGM`,
      rank: 0,
      description: `Insert and Take Camera ${cameraSource.name}.`,
      type: PartActionType.INSERT_PART_AS_ON_AIR,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [cameraPieceInterface]
      },
      metadata: {
        contentType: Tv2ActionContentType.CAMERA,
        cameraNumber: cameraSource.name,
      },
    }
  }
}
