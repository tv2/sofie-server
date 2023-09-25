import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, PieceAction } from '../../model/entities/action'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './value-objects/tv2-show-style-blueprint-configuration'
import { Tv2CameraFactory } from './factories/tv2-camera-factory'
import { ActionType } from '../../model/enums/action-type'
import { PieceInterface } from '../../model/entities/piece'
import { PieceType } from '../../model/enums/piece-type'
import { PieceLifespan } from '../../model/enums/piece-lifespan'
import { Tv2SisyfosLayer, Tv2SourceLayer } from './value-objects/tv2-layers'
import { TransitionType } from '../../model/enums/transition-type'
import { DeviceType } from '../../model/enums/device-type'

export class Tv2ActionsService implements BlueprintGenerateActions {

  constructor(private readonly cameraFactory: Tv2CameraFactory) {}

  public generateActions(configuration: Configuration): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: configuration.showStyle.blueprintConfiguration as Tv2ShowStyleBlueprintConfiguration
    }

    const cameraActions: Action[] = blueprintConfiguration.studio.SourcesCam
      .slice(0, 5)
      .flatMap(source => [
        this.cameraFactory.createInsertCameraAsNextAction(blueprintConfiguration, source),
        this.cameraFactory.createInsertCameraAsOnAirAction(blueprintConfiguration, source)
      ])

    const audioActions: Action[] = [
      this.createStopAudioBedAction()
    ]

    return [
      ...cameraActions,
      ...audioActions
    ]
  }

  private createStopAudioBedAction(): PieceAction {
    const duration: number = 1000
    const pieceInterface: PieceInterface = {
      id: 'stopAudioBedPiece',
      name: 'Stop audio bed',
      partId: '',
      type: PieceType.AUDIO,
      layer: Tv2SourceLayer.AUDIO_BED,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: true,
      start: 0,
      duration,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [
        {
          id: '',
          enable: {
            start: 0,
            duration
          },
          priority: 1,
          layer: Tv2SisyfosLayer.AUDIO_BED,
          content: {
            deviceType: DeviceType.ABSTRACT,
            type: 'empty'
          }
        }
      ]
    }
    return {
      id: 'stopAudioBedAction',
      name: 'Stop audio bed',
      type: ActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }
}
