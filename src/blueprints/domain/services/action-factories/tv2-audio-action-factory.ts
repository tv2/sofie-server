import {
  Action,
  ActionArgumentType,
  ActionManifest,
  MutateActionMethods,
  MutateActionType
} from '../../../../action-system/domain/entities/action'
import { Tv2PieceLayer } from '../../value-objects/tv2-layers'
import { PieceLifespan } from '../../../../rundown-execution/domain/enums/piece-lifespan'
import { TransitionType } from '../../../../rundown-execution/domain/enums/transition-type'
import { PieceActionType } from '../../../../action-system/domain/enums/action-type'
import { Tv2Action, Tv2ActionSubtype, Tv2AudioAction, Tv2FadeAudioBedAction, } from '../../value-objects/tv2-action'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-blueprint-timeline-object'
import { Tv2PieceInterface } from '../../entities/tv2-piece-interface'
import { ActionFactory } from './action-factory'
import {
  Tv2AudioBedTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-bed-timeline-object-factory'
import { Tv2ActionManifest } from '../../value-objects/tv2-action-manifest'
import { Tv2ActionManifestAudioBedData } from '../../value-objects/tv2-action-manifest-data'
import { FrameTimeConverter } from '../frame-time-converter'
import { Logger } from '../../../../cross-cutting-concerns/application/interfaces/logger'
import { PieceMetadata } from '../../../../rundown-execution/domain/value-objects/metadata'
import { OutputLayer } from '../../../../rundown-execution/domain/enums/output-layer'
import { PlayoutContentType } from '../../../../rundown-execution/domain/enums/playout-content-type'
import { OutputChannel } from '../../../../rundown-execution/domain/enums/output-channel'

const AUDIO_BED_ACTION_ID: string = Tv2PieceLayer.AUDIO_BED

export class Tv2AudioActionFactory extends ActionFactory {
  private readonly logger: Logger

  constructor(
    private readonly audioMixerTimelineObjectFactory: Tv2AudioMixerTimelineObjectFactory,
    private readonly audioBedTimelineObjectFactory: Tv2AudioBedTimelineObjectFactory,
    private readonly frameTimeConverter: FrameTimeConverter,
    logger: Logger,
  ) {
    super()
    this.logger = logger.tag(this.constructor.name)
  }

  public isAudioAction(action: Tv2Action): boolean {
    const actionSubType: Tv2ActionSubtype | undefined = action.metadata.actionSubtype
    return actionSubType !== undefined && [Tv2ActionSubtype.FADE_AUDIO_BED].includes(actionSubType)
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

  public createAudioActions(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2ActionManifest[]): Tv2AudioAction[] {
    return [
      this.createFadePersistedAudioAction(),
      this.createStudioMicrophonesUpAction(blueprintConfiguration),
      this.createStudioMicrophonesDownAction(blueprintConfiguration),
      ...this.createAudioBedActionsFromActionManifests(blueprintConfiguration, actionManifests),
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
      rank: 0,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  }

  private createFadePersistedAudioMetadata(): PieceMetadata {
    return {
      playoutContent: {
        type: PlayoutContentType.COMMAND
      },
      outputLayer: OutputLayer.AUDIO,
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
        this.audioMixerTimelineObjectFactory.createStudioMicrophonesUpTimelineObject(blueprintConfiguration)
      ]
    })
    return {
      id: 'studioMicrophonesUpAction',
      name: 'Studio Microphones Up',
      rank: 0,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM
      },
    }
  }

  private createAudioCommandPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>): Tv2PieceInterface {
    return {
      partId: '',
      rundownId: '',
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      layer: Tv2PieceLayer.AUDIO_ACTION_COMMAND,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      duration: 0,
      takenOffAirTimestamp: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [],
      metadata: {
        playoutContent: {
          type: PlayoutContentType.COMMAND
        },
        outputLayer: OutputLayer.SECONDARY,
      },
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createStudioMicrophonesDownAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2AudioAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioCommandPieceInterface({
      id: 'studioMicrophonesDownPiece',
      name: 'Studio Microphones Down',
      timelineObjects: [
        this.audioMixerTimelineObjectFactory.createStudioMicrophonesDownTimelineObject(blueprintConfiguration)
      ]
    })
    return {
      id: 'studioMicrophonesDownAction',
      name: 'Studio Microphones Down',
      rank: 0,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  }

  private createAudioBedActionsFromActionManifests(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2ActionManifest[]): Tv2AudioAction[] {
    const audioBedActions: Tv2AudioAction[] = actionManifests
      .filter(this.isAudioBedActionManifest.bind(this))
      .reduce<Tv2AudioAction[]>(
        (audioBedActions, audioBedActionManifest) => {
          try {
            return [...audioBedActions, this.createAudioBedActionFromActionManifest(blueprintConfiguration, audioBedActionManifest)]
          } catch (error) {
            this.logger.data(error).warn(`Failed creating audio bed action for action manifest '${audioBedActionManifest.data.name}'.`)
            return audioBedActions
          }
        }, []
      )

    return this.removeDuplicateActions(audioBedActions)
  }

  private isAudioBedActionManifest(actionManifest: Tv2ActionManifest): actionManifest is ActionManifest<Tv2ActionManifestAudioBedData> {
    return actionManifest.actionId === AUDIO_BED_ACTION_ID
  }

  private createAudioBedActionFromActionManifest(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifest: ActionManifest<Tv2ActionManifestAudioBedData>): Tv2AudioAction {
    const audioBedName: string = actionManifest.data.name
    return {
      id: `audioBed_${audioBedName}`,
      name: audioBedName,
      rundownId: actionManifest.rundownId,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      rank: actionManifest.data.rank,
      description: `Start ${audioBedName}.`,
      data: {
        pieceInterface: this.createAudioBedPieceInterface({
          id: `audioBed_${audioBedName}`,
          name: audioBedName,
          pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          timelineObjects: [
            this.audioBedTimelineObjectFactory.createAudioBedTimelineObject(audioBedName, blueprintConfiguration),
            this.audioMixerTimelineObjectFactory.createAudioBedAudioTimelineObject(),
          ]
        })
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM
      },
    }
  }

  private createStopAudioBedAction(): Tv2AudioAction {
    const duration: number = 1000
    const pieceInterface: Tv2PieceInterface = this.createAudioBedPieceInterface({
      id: 'stopAudioBedPiece',
      name: 'Stop audio bed',
      duration,
      timelineObjects: [
        this.audioMixerTimelineObjectFactory.createStopAudioBedTimelineObject(duration)
      ]
    })
    return {
      id: 'stopAudioBedAction',
      name: 'Stop audio bed',
      rank: 0,
      description: 'Stops audio bed.',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM
      },
    }
  }

  private createAudioBedPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>): Tv2PieceInterface {
    return {
      partId: '',
      rundownId: '',
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      layer: Tv2PieceLayer.AUDIO_BED,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      takenOffAirTimestamp: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [],
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputLayer: OutputLayer.AUDIO,
      },
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createFadeAudioBedAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2FadeAudioBedAction {
    const pieceInterface: Tv2PieceInterface = this.createAudioBedPieceInterface({
      id: 'fadeAudioBedPiece',
      name: 'Fade Audio bed',
      duration: 0,
    })
    return {
      id: 'fadeAudioBedAction',
      name: 'Fade Audio bed',
      rank: 0,
      description: 'Fades the Audio bed',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM,
        actionSubtype: Tv2ActionSubtype.FADE_AUDIO_BED,
        defaultFadeDurationInFrames: blueprintConfiguration.studio.audioBedSettings.fadeOutDurationInFrames
      },
      argument: {
        name: 'Fade duration',
        description: 'The duration of the fade in frames',
        type: ActionArgumentType.NUMBER
      }
    }
  }

  private applyFadeArgumentToFadeAction(action: Action, fadeDurationInFrames: unknown): Action {
    const audioAction: Tv2FadeAudioBedAction = action as Tv2FadeAudioBedAction

    const fadeDurationInMilliseconds: number = this.frameTimeConverter.convertFramesToMilliseconds(this.isInteger(fadeDurationInFrames) ? fadeDurationInFrames : audioAction.metadata.defaultFadeDurationInFrames)
    const fadeAudioBedTimelineObjects: Tv2BlueprintTimelineObject[] = [
      this.audioBedTimelineObjectFactory.createFadeAudioBedTimelineObject(fadeDurationInMilliseconds),
      this.audioMixerTimelineObjectFactory.createAudioBedAudioTimelineObject(),
    ]

    audioAction.data.pieceInterface.timelineObjects.push(...fadeAudioBedTimelineObjects)
    audioAction.data.pieceInterface.duration = fadeDurationInMilliseconds

    return audioAction
  }

  private isInteger(obj: unknown): obj is number {
    return Number.isInteger(obj)
  }

  private createResynchronizeAudioAction(): Tv2AudioAction {
    const duration: number = 1000
    const pieceInterface: Tv2PieceInterface = this.createAudioCommandPieceInterface({
      id: 'resynchronizeAudioPiece',
      name: 'Resynchronize Audio',
      duration,
      timelineObjects: [
        this.audioMixerTimelineObjectFactory.createResynchronizeTimelineObject()
      ]
    })
    return {
      id: 'resynchronizeAudioAction',
      name: 'Resynchronize Audio',
      rank: 0,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  }
}
