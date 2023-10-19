import { Action, PieceAction } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceActionType } from '../../../model/enums/action-type'
import { Tv2AudioTimelineObjectFactory } from '../value-objects/factories/tv2-audio-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'


export class Tv2AudioActionFactory {
  constructor(private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory) { }

  public createAudioActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createStopAudioBedAction(),
      this.createMicrophoneUpAction(blueprintConfiguration),
      this.createMicrophoneDownAction(blueprintConfiguration),
      this.createResynchronizeAudioAction(),
      this.createFadePersistedAudioAction()
    ]
  }

  private createFadePersistedAudioAction(): PieceAction {
    const pieceInterface: PieceInterface = this.createAudioPieceInterface({
      id: 'fadePersistedAudioPiece',
      name: 'Fade Persisted Audio',
      metadata: this.createFadePersistedAudioMetadata()
    })
    return {
      id: 'fadePersistedAudioAction',
      name: 'Fade Persisted Audio',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createFadePersistedAudioMetadata(): Tv2PieceMetadata {
    return {
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: false,
        wantsToPersistAudio: false
      }
    }
  }

  private createMicrophoneUpAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const pieceInterface: PieceInterface = this.createAudioPieceInterface({
      id: 'microphoneUpPiece',
      name: 'Microphone Up',
      timelineObjects: [
        this.audioTimelineObjectFactory.createMicrophoneUpTimelineObject(blueprintConfiguration)
      ]
    })
    return {
      id: 'microphoneUpAction',
      name: 'Microphone Up',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createAudioPieceInterface(pieceInterfaceWithRequiredValues: Pick<PieceInterface, 'id' | 'name'> & Partial<PieceInterface>): PieceInterface {
    return {
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
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createMicrophoneDownAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const pieceInterface: PieceInterface = this.createAudioPieceInterface({
      id: 'microphoneDownPiece',
      name: 'Microphone Down',
      timelineObjects: [
        this.audioTimelineObjectFactory.createMicrophoneDownTimelineObject(blueprintConfiguration)
      ]
    })
    return {
      id: 'microphoneDownAction',
      name: 'Microphone Down',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createStopAudioBedAction(): PieceAction {
    const duration: number = 1000
    const pieceInterface: PieceInterface = this.createAudioPieceInterface({
      id: 'stopAudioBedPiece',
      name: 'Stop audio bed',
      layer: Tv2SourceLayer.AUDIO_BED,
      duration,
      timelineObjects: [
        this.audioTimelineObjectFactory.createStopAudioBedTimelineObject(duration)
      ]
    })
    return {
      id: 'stopAudioBedAction',
      name: 'Stop audio bed',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createResynchronizeAudioAction(): PieceAction {
    const duration: number = 1000
    const pieceInterface: PieceInterface = this.createAudioPieceInterface({
      id: 'resynchronizeAudioPiece',
      name: 'Resynchronize Audio',
      duration,
      timelineObjects: [
        this.audioTimelineObjectFactory.createResynchronizeTimelineObject()
      ]
    })
    return {
      id: 'resynchronizeAudioAction',
      name: 'Resynchronize Audio',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }
}
