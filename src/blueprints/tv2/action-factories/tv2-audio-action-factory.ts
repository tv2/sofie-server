import { Action } from '../../../model/entities/action'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceActionType } from '../../../model/enums/action-type'
import { Tv2ActionContentType, Tv2AudioAction, Tv2PieceAction } from '../value-objects/tv2-action'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'


export class Tv2AudioActionFactory {
  constructor(private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory) { }

  public createAudioActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createStopAudioBedAction(),
      this.createStudioMicrophonesUpAction(blueprintConfiguration),
      this.createStudioMicrophonesDownAction(blueprintConfiguration),
      this.createResynchronizeAudioAction(),
      this.createFadePersistedAudioAction()
    ]
  }

  private createFadePersistedAudioAction(): Tv2PieceAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioPieceInterface({
      id: 'fadePersistedAudioPiece',
      name: 'Fade Persisted Audio',
      metadata: this.createFadePersistedAudioMetadata()
    })
    return {
      id: 'fadePersistedAudioAction',
      name: 'Fade Persisted Audio',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.AUDIO
      }
    }
  }

  private createFadePersistedAudioMetadata(): Tv2PieceMetadata {
    return {
      type: Tv2PieceType.COMMAND,
      outputLayer: Tv2OutputLayer.AUDIO,
      sisyfosPersistMetaData: {
        sisyfosLayers: [],
        acceptsPersistedAudio: false,
        wantsToPersistAudio: false
      }
    }
  }

  private createStudioMicrophonesUpAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2AudioAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioPieceInterface({
      id: 'studioMicrophonesUpPiece',
      name: 'Studio Microphones Up',
      timelineObjects: [
        this.audioTimelineObjectFactory.createStudioMicrophonesUpTimelineObject(blueprintConfiguration)
      ]
    })
    return {
      id: 'studioMicrophonesUpAction',
      name: 'Studio Microphones Up',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.AUDIO,
      },
    }
  }

  private createAudioPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>): Tv2PieceInterface {
    return {
      duration: 0,
      partId: '',
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      layer: Tv2SourceLayer.AUDIO_ACTION_COMMAND,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [],
      metadata: {
        type: Tv2PieceType.COMMAND,
        outputLayer: Tv2OutputLayer.SECONDARY,
      },
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createStudioMicrophonesDownAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioPieceInterface({
      id: 'studioMicrophonesDownPiece',
      name: 'Studio Microphones Down',
      timelineObjects: [
        this.audioTimelineObjectFactory.createStudioMicrophonesDownTimelineObject(blueprintConfiguration)
      ]
    })
    return {
      id: 'studioMicrophonesDownAction',
      name: 'Studio Microphones Down',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.AUDIO
      }
    }
  }

  private createStopAudioBedAction(): Tv2PieceAction {
    const duration: number = 1000
    const pieceInterface: Tv2PieceInterface = this.createAudioPieceInterface({
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
      description: 'Stops audio bed.',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.AUDIO,
      },
    }
  }

  private createResynchronizeAudioAction(): Tv2PieceAction {
    const duration: number = 1000
    const pieceInterface: Tv2PieceInterface = this.createAudioPieceInterface({
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
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.AUDIO
      }
    }
  }
}
