import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceActionType } from '../../../model/enums/action-type'
import {
  Tv2Action,
  Tv2ActionContentType,
  Tv2ActionSubtype,
  Tv2AudioAction,
  Tv2FadeAudioBedAction,
  Tv2PieceAction
} from '../value-objects/tv2-action'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2CasparCgTimelineObjectFactory } from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { TimelineObject } from '../../../model/entities/timeline-object'

const FRAME_RATE: number = 25

export class Tv2AudioActionFactory {

  constructor(
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly casparCgTimelineObjectFactory: Tv2CasparCgTimelineObjectFactory
  ) { }

  public isAudioAction(action: Tv2Action): boolean {
    const actionSubType: Tv2ActionSubtype | undefined = action.metadata.actionSubtype
    return  actionSubType !== undefined && [Tv2ActionSubtype.FADE_AUDIO_BED].includes(actionSubType)
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    switch (action.metadata.actionSubtype) {
      case Tv2ActionSubtype.FADE_AUDIO_BED: {
        return [{
          type: MutateActionType.APPLY_ARGUMENTS,
          updateActionWithArguments: (action: Action, actionArguments: unknown) => this.applyFadeArgumentToFadeAction(action, actionArguments)
        }]
      }
    }
    return []
  }

  public createAudioActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createFadePersistedAudioAction(),
      this.createStudioMicrophonesUpAction(blueprintConfiguration),
      this.createStudioMicrophonesDownAction(blueprintConfiguration),
      this.createStopAudioBedAction(),
      this.createFadeAudioBedAction(blueprintConfiguration),
      this.createResynchronizeAudioAction(),
    ]
  }

  private createFadePersistedAudioAction(): Tv2AudioAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioCommandPieceInterface({
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
    const pieceInterface: Tv2PieceInterface = this.createAudioCommandPieceInterface({
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

  private createAudioCommandPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>): Tv2PieceInterface {
    return {
      partId: '',
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      layer: Tv2SourceLayer.AUDIO_ACTION_COMMAND,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      duration: 0,
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

  private createStudioMicrophonesDownAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2AudioAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioCommandPieceInterface({
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
    const pieceInterface: Tv2PieceInterface = this.createAudioBedPieceInterface({
      id: 'stopAudioBedPiece',
      name: 'Stop audio bed',
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

  private createAudioBedPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>): Tv2PieceInterface {
    return {
      partId: '',
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      layer: Tv2SourceLayer.AUDIO_BED,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [],
      metadata: {
        type: Tv2PieceType.AUDIO,
        outputLayer: Tv2OutputLayer.AUDIO,
      },
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createFadeAudioBedAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2FadeAudioBedAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioBedPieceInterface({
      id: 'fadeAudioBedPiece',
      name: 'Fade Audio bed',
    })
    return {
      id: 'fadeAudioBedAction',
      name: 'Fade Audio bed',
      description: 'Fades the Audio bed',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.AUDIO,
        actionSubtype: Tv2ActionSubtype.FADE_AUDIO_BED,
        defaultFadeDurationInFrames: blueprintConfiguration.studio.AudioBedSettings.fadeOut
      }
    }
  }

  private applyFadeArgumentToFadeAction(action: Action, fadeDurationInFrames: unknown): Action {
    const audioAction: Tv2FadeAudioBedAction = action as Tv2FadeAudioBedAction

    const fadeDurationInMilliseconds: number =  this.getTimeFromFrames(this.isInteger(fadeDurationInFrames) ? fadeDurationInFrames : audioAction.metadata.defaultFadeDurationInFrames)
    const fadeAudioBedTimelineObject: TimelineObject = this.casparCgTimelineObjectFactory.createFadeAudioBedTimelineObject(fadeDurationInMilliseconds)

    audioAction.data.pieceInterface.timelineObjects.push(fadeAudioBedTimelineObject)
    audioAction.data.pieceInterface.duration = fadeDurationInMilliseconds

    return audioAction
  }

  private isInteger(obj: unknown): obj is number {
    return Number.isInteger(obj)
  }

  private getTimeFromFrames(frames: number): number {
    return (1000 / FRAME_RATE) * frames
  }

  private createResynchronizeAudioAction(): Tv2AudioAction {
    const duration: number = 1000
    const pieceInterface: Tv2PieceInterface = this.createAudioCommandPieceInterface({
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
