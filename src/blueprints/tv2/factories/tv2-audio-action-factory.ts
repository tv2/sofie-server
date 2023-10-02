import { PieceAction } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SisyfosLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { DeviceType } from '../../../model/enums/device-type'
import { PieceActionType } from '../../../model/enums/action-type'

export class Tv2AudioActionFactory {

  public createStopAudioBedAction(): PieceAction {
    const duration: number = 1000
    const pieceInterface: PieceInterface = {
      id: 'stopAudioBedPiece',
      name: 'Stop audio bed',
      partId: '',
      type: PieceType.AUDIO,
      layer: Tv2SourceLayer.AUDIO_BED,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
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
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }
}
