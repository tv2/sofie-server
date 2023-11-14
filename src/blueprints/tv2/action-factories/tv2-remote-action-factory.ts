import { Piece, PieceInterface } from '../../../model/entities/piece'
import { Part, PartInterface } from '../../../model/entities/part'
import { PartActionType } from '../../../model/enums/action-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'
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

export class Tv2RemoteActionFactory {
  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {}

  public createRemoteActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PartAction[] {
    return [
      ...this.createInsertRemoteAsNextActions(blueprintConfiguration),
      this.createRecallLastPlannedRemoteAsNextAction(),
    ]
  }

  private createInsertRemoteAsNextActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2RemoteAction[] {
    return blueprintConfiguration.studio.SourcesRM
      .map(source => this.createInsertRemoteAsNextAction(blueprintConfiguration, source))
  }

  private createInsertRemoteAsNextAction(configuration: Tv2BlueprintConfiguration, remoteSource: Tv2SourceMappingWithSound): Tv2RemoteAction {
    const partId: string = `remoteInsertActionPart_${remoteSource._id}`
    const remotePieceInterface: PieceInterface = this.createRemotePiece(configuration, remoteSource, partId)
    const partInterface: PartInterface = this.createPartInterface(partId, remoteSource)
    return {
      id: `remoteAsNextAction_${remoteSource._id}`,
      name: `LIVE ${remoteSource.SourceName}`,
      description: `Insert LIVE ${remoteSource.SourceName} as next.`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [remotePieceInterface]
      },
      metadata: {
        contentType: Tv2ActionContentType.REMOTE,
        remoteNumber: remoteSource.SourceName,
      },
    }
  }

  private createRemotePiece(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, parentPartId: string): PieceInterface {
    const videoMixerTimelineObjects: TimelineObject[] = this.createVideoMixerTimelineObjects(source)
    const audioTimelineObjects: TimelineObject[] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(configuration, source)

    const metadata: Tv2PieceMetadata = {
      type: Tv2PieceType.REMOTE,
      outputLayer: Tv2OutputLayer.PROGRAM,
      sisyfosPersistMetaData: {
        sisyfosLayers: source.SisyfosLayers,
        wantsToPersistAudio: source.WantsToPersistAudio,
        acceptsPersistedAudio: source.AcceptPersistAudio,
        // TODO: Blueprints sets "isModifiedOrInsertedByAction" here which is used for getEndStateForPart and onTimelineGenerate.
        // TODO: We should instead use something like Piece.isPlanned
      }
    }

    return {
      id: `remoteAction_${source._id}`,
      partId: parentPartId,
      name: `LIVE ${source.SourceName}`,
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

  private createVideoMixerTimelineObjects(source: Tv2SourceMappingWithSound): TimelineObject[] {
    const enable: TimelineEnable = { start: 0 }
    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(source.SwitcherSource, enable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(source.SwitcherSource, enable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(source.SwitcherSource, enable),
    ]
  }

  private createPartInterface(partId: string, source: Tv2SourceMappingWithSound): PartInterface {
    return {
      id: partId,
      name: `Live Part ${source.SourceName}`,
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
        pieceInterfaces: [] as PieceInterface[], // Is determined when called.
      }
    }
  }

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

    const pieceInterfaces: PieceInterface[] = historicPart.getPieces().map(piece => ({
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
      metadata: piece.metadata,
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
