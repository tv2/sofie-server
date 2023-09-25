import { PieceInterface } from '../../../model/entities/piece'
import { PartInterface } from '../../../model/entities/part'
import { ActionType } from '../../../model/enums/action-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2PieceMetadata } from '../value-objects/tv2-meta-data'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2AtemLayer, Tv2SisyfosLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import {
  AtemAuxTimelineObject,
  AtemMeTimelineObject,
  AtemTransition,
  AtemType
} from '../../timeline-state-resolver-types/atem-types'
import { DeviceType } from '../../../model/enums/device-type'
import {
  SisyfosChannelsTimelineObject,
  SisyfosChannelTimelineObject,
  SisyfosType
} from '../../timeline-state-resolver-types/sisyfos-types'
import { PartAction } from '../../../model/entities/action'

export class Tv2CameraFactory {

  public createInsertCameraAsNextAction(configuration: Tv2BlueprintConfiguration, cameraSource: Tv2SourceMappingWithSound): PartAction {
    const partId: string = `cameraInsertActionPart_${cameraSource._id}`
    const cameraPieceInterface: PieceInterface = this.createCameraPiece(configuration, cameraSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, cameraSource)
    return {
      id: `cameraAsNextAction_${cameraSource._id}`,
      name: `Insert Camera ${cameraSource.SourceName}`,
      type: ActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [cameraPieceInterface]
      }
    }
  }

  private createCameraPiece(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, parentPartId: string): PieceInterface {
    const cameraTimelineObjects: TimelineObject[] = this.createCameraTimelineObjects(source)
    const sisyfosTimelineObjects: TimelineObject[] = this.createSisyfosTimelineObjects(configuration, source)

    const metadata: Tv2PieceMetadata = {
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: source.AcceptPersistAudio
        // TODO: Blueprints sets "isModifiedOrInsertedByAction" here which is used for getEndStateForPart and onTimelineGenerate.
        // TODO: We should instead use something like Piece.isAdLib
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
      isPlanned: true,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      metadata,
      tags: [],
      timelineObjects: [
        ...cameraTimelineObjects,
        ...sisyfosTimelineObjects
      ]
    }
  }

  private createCameraTimelineObjects(source: Tv2SourceMappingWithSound): TimelineObject[] {
    const programTimelineObject: AtemMeTimelineObject = {
      id: `insertedProgram_${source._id}`,
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2AtemLayer.PROGRAM,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          input: source.SwitcherSource,
          transition: AtemTransition.CUT
        }
      }
    }

    const lookaheadTimelineObject: AtemAuxTimelineObject = {
      id: `insertedLookahead_${source._id}`,
      enable: {
        start: 0
      },
      priority: 0,
      layer: Tv2AtemLayer.LOOKAHEAD,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.AUX,
        aux: {
          input: source.SwitcherSource
        }
      }
    }

    return [programTimelineObject, lookaheadTimelineObject]
  }

  private createSisyfosTimelineObjects(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound): TimelineObject[] {
    const sisyfosChannelTimelineObjects: SisyfosChannelTimelineObject[] = source.SisyfosLayers.map(sisyfosLayer => {
      return {
        id: '',
        enable: {
          start: 0
        },
        layer: sisyfosLayer,
        content: {
          deviceType: DeviceType.SISYFOS,
          type: SisyfosType.CHANNEL,
          isPgm: 1
        }
      }
    })

    if (!source.StudioMics) {
      return sisyfosChannelTimelineObjects
    }

    return [
      ...sisyfosChannelTimelineObjects,
      this.createSisyfosStudioMicsTimelineObject(configuration)
    ]
  }

  private createSisyfosStudioMicsTimelineObject(configuration: Tv2BlueprintConfiguration): SisyfosChannelsTimelineObject {
    const studioMicsChannels: SisyfosChannelsTimelineObject['content']['channels'] = configuration.studio.StudioMics.map(studioMicLayer => {
      return {
        mappedLayer: studioMicLayer,
        isPgm: 1
      }
    })

    return {
      id: '',
      enable: {
        start: 0
      },
      priority: studioMicsChannels ? 2 : 0,
      layer: Tv2SisyfosLayer.STUDIO_MICS,
      content: {
        deviceType: DeviceType.SISYFOS,
        type: SisyfosType.CHANNELS,
        channels: studioMicsChannels,
        overridePriority: 2
      }
    }
  }

  private createPartInterface(partId: string, source: Tv2SourceMappingWithSound): PartInterface {
    return {
      id: partId,
      name: `Camera Part ${source.SourceName}`,
      segmentId: '',
      pieces: [],
      rank: -1,
      isPlanned: true,
      isOnAir: false,
      isNext: false,
      inTransition: {
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0
      },
      outTransition: {
        keepAliveDuration: 0
      },
      expectedDuration: 0,
      disableNextInTransition: false
    }
  }

  public createInsertCameraAsOnAirAction(configuration: Tv2BlueprintConfiguration, cameraSource: Tv2SourceMappingWithSound): PartAction {
    const partId: string = `cameraInsertAndTakeActionPart_${cameraSource._id}`
    const cameraPieceInterface: PieceInterface = this.createCameraPiece(configuration, cameraSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, cameraSource)
    return {
      id: `cameraAsOnAirAction_${cameraSource._id}`,
      name: `Insert and Take Camera ${cameraSource.SourceName}`,
      type: ActionType.INSERT_PART_AS_ON_AIR,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [cameraPieceInterface]
      }
    }
  }
}
