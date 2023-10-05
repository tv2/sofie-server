import { Action, PieceAction } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceActionType } from '../../../model/enums/action-type'
import { Tv2AudioTimelineObjectFactory } from '../value-objects/factories/tv2-audio-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'

export class Tv2AudioActionFactory {
  constructor(private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory) { }

  public createAudioActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createStopAudioBedAction(),
      this.createMicrophoneUpAction(blueprintConfiguration),
      this.createMicrophoneDownAction(blueprintConfiguration),
      this.createResynchronizeAudioAction()
    ]
  }

  private createMicrophoneUpAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const pieceInterface: PieceInterface = {
      ...this.createDefaultAudioPieceInterface(),
      id: 'microphoneUpPiece',
      name: 'Microphone Up',
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
      id: '',
      name: '',
      duration: 0,
      partId: '',
      type: PieceType.AUDIO,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      layer: Tv2SourceLayer.AUDIO_ACTION_COMMAND,
      isPlanned: false,
      start: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [],
    }
  }

  private createMicrophoneDownAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const pieceInterface: PieceInterface = {
      ...this.createDefaultAudioPieceInterface(),
      id: 'microphoneDownPiece',
      name: 'Microphone Down',
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

  private createStopAudioBedAction(): PieceAction {
    const duration: number = 1000
    const pieceInterface: PieceInterface = {
      ...this.createDefaultAudioPieceInterface(),
      id: 'stopAudioBedPiece',
      name: 'Stop audio bed',
      layer: Tv2SourceLayer.AUDIO_BED,
      duration,
      timelineObjects: [
        this.audioTimelineObjectFactory.createStopAudioBedTimelineObject(duration)
      ]
    }
    return {
      id: 'stopAudioBedAction',
      name: 'Stop audio bed',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createResynchronizeAudioAction(): PieceAction {
    const duration: number = 1000
    const pieceInterface: PieceInterface = {
      ...this.createDefaultAudioPieceInterface(),
      id: 'resynchronizeAudioPiece',
      name: 'Resynchronize Audio',
      duration,
      tags: [],
      timelineObjects: [
        this.audioTimelineObjectFactory.createResynchronizeTimelineObject()
      ]
    }
    return {
      id: 'resynchronizeAudioAction',
      name: 'Resynchronize Audio',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }
}
