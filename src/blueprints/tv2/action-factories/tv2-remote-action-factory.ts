import { Piece } from '../../../model/entities/piece'
import { Part, PartInterface } from '../../../model/entities/part'
import { PartActionType } from '../../../model/enums/action-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import {
  Tv2Action,
  Tv2ActionContentType,
  Tv2ActionSubtype,
  Tv2PartAction,
  Tv2RecallLastPlannedRemoteAsNextAction,
  Tv2RemoteAction
} from '../value-objects/tv2-action'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'

export class Tv2RemoteActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {}

  public isRemoteAction(action: Tv2Action): action is Tv2RemoteAction {
    return action.metadata.contentType === Tv2ActionContentType.REMOTE
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    switch (action.metadata.actionSubtype) {
      case Tv2ActionSubtype.RECALL_LAST_PLANNED_REMOTE:
        return this.getRecallLastPlannedRemoteMutateActions()

      default:
        return []
    }
  }

  public createRemoteActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PartAction[] {
    return [
      ...this.createInsertRemoteAsNextActions(blueprintConfiguration),
      this.createRecallLastPlannedRemoteAsNextAction(),
    ]
  }

  private createInsertRemoteAsNextActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2RemoteAction[] {
    return blueprintConfiguration.studio.remoteSources
      .map(source => this.createInsertRemoteAsNextAction(blueprintConfiguration, source))
  }

  private createInsertRemoteAsNextAction(configuration: Tv2BlueprintConfiguration, remoteSource: Tv2SourceMappingWithSound): Tv2RemoteAction {
    const partId: string = `remoteInsertActionPart_${remoteSource.name}`
    const remotePieceInterface: Tv2PieceInterface = this.createRemotePieceInterface(configuration, remoteSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, remoteSource)
    return {
      id: `remoteAsNextAction_${remoteSource.name}`,
      name: `LIVE ${remoteSource.name}`,
      description: `Insert LIVE ${remoteSource.name} as next.`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [remotePieceInterface]
      },
      metadata: {
        contentType: Tv2ActionContentType.REMOTE,
        remoteNumber: remoteSource.name,
      },
    }
  }

  private createRemotePieceInterface(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, parentPartId: string): Tv2PieceInterface {
    const videoMixerTimelineObjects: Tv2BlueprintTimelineObject[] = this.createVideoMixerTimelineObjects(source)
    const audioTimelineObjects: Tv2BlueprintTimelineObject[] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(configuration, source)

    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.REMOTE,
      outputLayer: Tv2OutputLayer.PROGRAM,
      sisyfosPersistMetaData: {
        sisyfosLayers: source.sisyfosLayers,
        wantsToPersistAudio: source.wantsToPersistAudio,
        acceptsPersistedAudio: source.acceptPersistAudio
      }
    }

    return {
      id: `remoteAction_${source.id}`,
      partId: parentPartId,
      name: `LIVE ${source.name}`,
      layer: Tv2SourceLayer.REMOTE,
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

  private createVideoMixerTimelineObjects(source: Tv2SourceMappingWithSound): Tv2BlueprintTimelineObject[] {
    const enable: TimelineEnable = { start: 0 }
    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(source.videoMixerSource, enable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(source.videoMixerSource, enable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(source.videoMixerSource, enable),
    ]
  }

  private createPartInterface(partId: string, source: Tv2SourceMappingWithSound): PartInterface {
    return {
      id: partId,
      name: `Live Part ${source.name}`,
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

  private createRecallLastPlannedRemoteAsNextAction(): Tv2RecallLastPlannedRemoteAsNextAction {
    return {
      id: 'recall_last_planned_remote_as_next_action',
      name: 'Recall last Live',
      description: 'Recalls the last live that has been on air.',
      type: PartActionType.INSERT_PART_AS_NEXT,
      metadata: {
        contentType: Tv2ActionContentType.REMOTE,
        actionSubtype: Tv2ActionSubtype.RECALL_LAST_PLANNED_REMOTE,
      },
      data: {
        partInterface: {} as PartInterface, // Is determined when called.
        pieceInterfaces: [] as Tv2PieceInterface[], // Is determined when called.
      }
    }
  }

  private getRecallLastPlannedRemoteMutateActions(): MutateActionMethods[] {
    return [
      {
        type: MutateActionType.HISTORIC_PART,
        updateActionWithPartData: this.updateInsertLastPlannedRemoteToInputAction.bind(this),
        partPredicate: (part: Part) => part.isPlanned && this.doesPartContainARemotePiece(part),
      }
    ]
  }

  private updateInsertLastPlannedRemoteToInputAction(action: Action, historicPart: Part): Tv2RecallLastPlannedRemoteAsNextAction {
    const clonedPart: Part = historicPart.clone()
    clonedPart.reset()

    const partInterface: PartInterface = {
      id: `recall_last_planned_remote_part_${clonedPart.id}`,
      name: clonedPart.name,
      segmentId: '',
      rank: -1,
      isPlanned: false,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      inTransition: {
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0,
      },
      outTransition: {
        keepAliveDuration: 0,
      },
      disableNextInTransition: false,
      pieces: [],
    }

    const pieceInterfaces: Tv2PieceInterface[] = historicPart.getPieces().map(piece => ({
      id: `recall_last_planned_remote_piece_${piece.id}`,
      partId: partInterface.id,
      name: piece.name,
      layer: piece.layer,
      pieceLifespan: piece.pieceLifespan,
      transitionType: piece.transitionType,
      isPlanned: false,
      start: piece.getStart(),
      duration: piece.duration,
      preRollDuration: piece.preRollDuration,
      postRollDuration: piece.postRollDuration,
      metadata: piece.metadata as Tv2PieceMetadata,
      tags: [],
      isUnsynced: false,
      timelineObjects: piece.timelineObjects,
    }))

    const recallLastPlannedRemoteAction: Tv2RecallLastPlannedRemoteAsNextAction = action as Tv2RecallLastPlannedRemoteAsNextAction
    return {
      ...recallLastPlannedRemoteAction,
      data: {
        partInterface,
        pieceInterfaces,
      }
    }
  }

  private doesPartContainARemotePiece(part: Part): boolean {
    return part.getPieces().some(piece => this.isRemotePiece(piece))
  }

  private isRemotePiece(piece: Piece): boolean {
    const metadata: Tv2PieceMetadata | undefined = piece.metadata as Tv2PieceMetadata | undefined
    return metadata?.type === Tv2PieceType.REMOTE
  }
}
