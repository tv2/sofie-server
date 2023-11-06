import { PieceInterface } from '../../../model/entities/piece'
import { PartInterface } from '../../../model/entities/part'
import { PartActionType } from '../../../model/enums/action-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2ActionContentType, Tv2CameraAction } from '../value-objects/tv2-action'
import { Action } from '../../../model/entities/action'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2PieceType } from '../enums/tv2-piece-type'
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
    return blueprintConfiguration.studio.SourcesCam
      .slice(0, 5)
      .flatMap(source => [
        this.createInsertCameraAsNextAction(blueprintConfiguration, source),
        this.createInsertCameraAsOnAirAction(blueprintConfiguration, source)
      ])
  }

  private createInsertCameraAsNextAction(configuration: Tv2BlueprintConfiguration, cameraSource: Tv2SourceMappingWithSound): Tv2CameraAction {
    const partId: string = `cameraInsertActionPart_${cameraSource._id}`
    const cameraPieceInterface: PieceInterface = this.createCameraPiece(configuration, cameraSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, cameraSource)
    return {
      id: `cameraAsNextAction_${cameraSource._id}`,
      name: `KAM ${cameraSource.SourceName} PVW`,
      description: `Insert Camera ${cameraSource.SourceName} as next.`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [cameraPieceInterface]
      },
      metadata: {
        contentType: Tv2ActionContentType.CAMERA,
        cameraNumber: cameraSource.SourceName,
      },
    }
  }

  private createCameraPiece(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, parentPartId: string): PieceInterface {
    const videoMixerTimelineObjects: TimelineObject[] = this.createVideoMixerTimelineObjects(source)
    const audioTimelineObjects: TimelineObject[] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(configuration, source)

    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.CAMERA,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: source.AcceptPersistAudio
        // TODO: Blueprints sets "isModifiedOrInsertedByAction" here which is used for getEndStateForPart and onTimelineGenerate.
        // TODO: We should instead use something like Piece.isPlanned
      }
    }

    return {
      id: `cameraAction_${source._id}`,
      partId: parentPartId,
      name: `KAM ${source.SourceName}`,
      type: PieceType.CAMERA,
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

  private createVideoMixerTimelineObjects(source: Tv2SourceMappingWithSound): TimelineObject[] {
    const enable: TimelineEnable = { start: 0 }
    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(`insertedProgram_${source._id}`, source.SwitcherSource, enable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(`insertedLookahead_${source._id}`, source.SwitcherSource, enable),
    ]
  }

  private createPartInterface(partId: string, source: Tv2SourceMappingWithSound): PartInterface {
    return {
      id: partId,
      name: `Camera Part ${source.SourceName}`,
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

  public createInsertCameraAsOnAirAction(configuration: Tv2BlueprintConfiguration, cameraSource: Tv2SourceMappingWithSound): Tv2CameraAction {
    const partId: string = `cameraInsertAndTakeActionPart_${cameraSource._id}`
    const cameraPieceInterface: PieceInterface = this.createCameraPiece(configuration, cameraSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, cameraSource)
    return {
      id: `cameraAsOnAirAction_${cameraSource._id}`,
      name: `KAM ${cameraSource.SourceName}`,
      description: `Insert and Take Camera ${cameraSource.SourceName}.`,
      type: PartActionType.INSERT_PART_AS_ON_AIR,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [cameraPieceInterface]
      },
      metadata: {
        contentType: Tv2ActionContentType.CAMERA,
        cameraNumber: cameraSource.SourceName,
      },
    }
  }
}
