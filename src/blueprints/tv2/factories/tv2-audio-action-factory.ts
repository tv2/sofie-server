import { Action, PieceAction } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SisyfosLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { DeviceType } from '../../../model/enums/device-type'
import { PieceActionType } from '../../../model/enums/action-type'
import { Tv2AudioTimelineObjectFactory } from '../value-objects/factories/tv2-audio-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'

export class Tv2AudioActionFactory {
  constructor(private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory) { }

  public createAudioActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createStopAudioBedAction(),
      this.createMicrophoneUpAction(blueprintConfiguration),
      this.createMicrophoneDownAction(blueprintConfiguration)
    ]
  }

  private createMicrophoneUpAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 0
    const pieceInterface: PieceInterface = {
      ...this.createDefaultAudioPieceInterface(),
      id: 'microphoneUpPiece',
      name: 'Microphone Up',
      layer: Tv2SourceLayer.AUDIO_ACTION_COMMAND,
      duration,
      tags: [],
      timelineObjects: [
        this.audioTimelineObjectFactory.createMicrophoneUpTimelineObject(blueprintConfiguration)
      ]
    }
    return {
      id: 'microphoneUpAction',
      name: 'Microphone Up',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createDefaultAudioPieceInterface(): PieceInterface {
    return {
      partId: '',
      type: PieceType.AUDIO,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      preRollDuration: 0,
      postRollDuration: 0,
    } as PieceInterface
  }

  private createMicrophoneDownAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 0
    const pieceInterface: PieceInterface = {
      ...this.createDefaultAudioPieceInterface(),
      id: 'microphoneDownPiece',
      name: 'Microphone Down',
      layer: Tv2SourceLayer.AUDIO_ACTION_COMMAND,
      duration,
      tags: [],
      timelineObjects: [
        this.audioTimelineObjectFactory.createMicrophoneDownTimelineObject(blueprintConfiguration)
      ]
    }
    return {
      id: 'microphoneDownAction',
      name: 'Microphone Down',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  // Todo: move TimeLine Object creation to the factory.
  private createStopAudioBedAction(): PieceAction {
    const duration: number = 1000
    const pieceInterface: PieceInterface = {
      ...this.createDefaultAudioPieceInterface(),
      id: 'stopAudioBedPiece',
      name: 'Stop audio bed',
      layer: Tv2SourceLayer.AUDIO_BED,
      duration,
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
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }


}
