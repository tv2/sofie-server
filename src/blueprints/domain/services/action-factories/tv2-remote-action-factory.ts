import {
  Piece,
} from '../../../../rundown-execution/domain/entities/piece'
import {
  Part,
  PartInterface,
} from '../../../../rundown-execution/domain/entities/part'
import {
  PartActionType,
  PieceActionType,
} from '../../../../action-system/domain/enums/action-type'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import {
  Tv2SourceAuxiliaryMapping,
  Tv2SourceMappingWithAudio,
} from '../../value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-blueprint-timeline-object'
import { Tv2PieceLayer } from '../../value-objects/tv2-layers'
import { PieceLifespan } from '../../../../rundown-execution/domain/enums/piece-lifespan'
import { TransitionType } from '../../../../rundown-execution/domain/enums/transition-type'
import {
  Tv2Action,
  Tv2ActionSubtype,
  Tv2RecallLastPlannedRemoteAsNextAction,
  Tv2RemoteAction,
} from '../../value-objects/tv2-action'
import { Tv2AudioMixerTimelineObjectFactory } from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import { Tv2VideoMixerTimelineObjectFactory } from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../../rundown-execution/domain/entities/timeline-enable'
import {
  Action,
  MutateActionMethods,
  MutateActionType,
} from '../../../../action-system/domain/entities/action'
import { Tv2PieceInterface } from '../../entities/tv2-piece-interface'
import { ActionFactory } from './action-factory'
import { PieceMetadata } from '../../../../rundown-execution/domain/value-objects/metadata'
import { OutputLayer } from '../../../../rundown-execution/domain/enums/output-layer'
import { PlayoutContentType } from '../../../../rundown-execution/domain/enums/playout-content-type'
import { OutputChannel } from '../../../../rundown-execution/domain/enums/output-channel'

export class Tv2RemoteActionFactory extends ActionFactory {
  public constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioMixerTimelineObjectFactory: Tv2AudioMixerTimelineObjectFactory
  ) {
    super()
  }

  public isRemoteAction(action: Tv2Action): boolean {
    return (
      action.metadata.playoutContent.type === PlayoutContentType.REMOTE
      || action.metadata.actionSubtype
      === Tv2ActionSubtype.RECALL_LAST_PLANNED_REMOTE
    )
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    switch (action.metadata.actionSubtype) {
      case Tv2ActionSubtype.RECALL_LAST_PLANNED_REMOTE:
        return this.getRecallLastPlannedRemoteMutateActions()

      default:
        return []
    }
  }

  public createRemoteActions(
    blueprintConfiguration: Tv2BlueprintConfiguration
  ): Tv2Action[] {
    return [
      ...this.createInsertRemoteAsNextActions(blueprintConfiguration),
      ...this.createInsertRemoteAsOnAirActions(blueprintConfiguration),
      ...this.createRouteToAuxiliaryActions(blueprintConfiguration),
      this.createRecallLastPlannedRemoteAsNextAction(),
    ]
  }

  private createInsertRemoteAsNextActions(
    blueprintConfiguration: Tv2BlueprintConfiguration
  ): Tv2RemoteAction[] {
    return [
      ...blueprintConfiguration.studio.remoteSources,
      ...blueprintConfiguration.studio.feedSources,
    ].map(source =>
      this.createInsertRemoteAsNextAction(blueprintConfiguration, source)
    )
  }

  private createRouteToAuxiliaryActions(
    configuration: Tv2BlueprintConfiguration
  ): Tv2RemoteAction[] {
    return configuration.studio.feedSources
      .concat(configuration.studio.cameraSources)
      .flatMap(source =>
        this.createRouteToAuxiliaryActionForSourceMapping(source, configuration)
      )
  }

  private createRouteToAuxiliaryActionForSourceMapping(
    remoteSourceMapping: Tv2SourceMappingWithAudio,
    configuration: Tv2BlueprintConfiguration
  ): Tv2RemoteAction[] {
    return configuration.studio.auxiliarySources.map(auxiliarySourceMapping =>
      this.createRouteToAuxiliaryAction(
        remoteSourceMapping,
        auxiliarySourceMapping,
      )
    )
  }

  private createRouteToAuxiliaryAction(
    remoteSourceMapping: Tv2SourceMappingWithAudio,
    auxiliarySourceMapping: Tv2SourceAuxiliaryMapping,
  ): Tv2RemoteAction {
    const sanitizedRemoteId: string = this.sanitizeStringForId(
      remoteSourceMapping.name
    )

    const sanitizedAuxiliaryId: string = this.sanitizeStringForId(
      auxiliarySourceMapping.auxiliaryId
    )
    const remotePieceInterface: Tv2PieceInterface
      = this.createRemoteAuxiliaryPieceInterface(
        remoteSourceMapping,
        auxiliarySourceMapping,
      )

    return {
      id: `routeSourceToAction_${sanitizedRemoteId}_aux${sanitizedAuxiliaryId}`,
      name: `${remoteSourceMapping.name} to AUX${auxiliarySourceMapping.auxiliaryId}`,
      rank: 0,
      description: `Routes ${remoteSourceMapping.name} to AUX${auxiliarySourceMapping.auxiliaryId}.`,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface: remotePieceInterface,
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REMOTE,
          source: remoteSourceMapping.name,
        },
        outputChannel: OutputChannel.PROGRAM,
      },
    }
  }

  private createRemoteAuxiliaryPieceInterface(
    remoteSourceMapping: Tv2SourceMappingWithAudio,
    auxiliarySourceMapping: Tv2SourceAuxiliaryMapping,
  ): Tv2PieceInterface {
    const sanitizedRemoteId: string = this.sanitizeStringForId(
      remoteSourceMapping.name
    )
    const sanitizedAuxiliaryId: string = this.sanitizeStringForId(
      auxiliarySourceMapping.auxiliaryId
    )

    return {
      id: `routeRemoteSourcePiece_${sanitizedRemoteId}_aux${sanitizedAuxiliaryId}`,
      name: `${remoteSourceMapping.name} \u2192 AUX${auxiliarySourceMapping.auxiliaryId}`,
      rundownId: '',
      partId: '',
      layer: Tv2PieceLayer.REMOTE,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      takenOffAirTimestamp: 0,
      tags: [],
      timelineObjects: [
        this.videoMixerTimelineObjectFactory.createAuxTimelineObject(
          remoteSourceMapping.videoMixerSource,
          auxiliarySourceMapping.layerId
        ),
      ],
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REMOTE,
          source: remoteSourceMapping.name,
        },
        outputLayer: OutputLayer.AUXILIARY,
      },
    }
  }

  private createInsertRemoteAsNextAction(
    configuration: Tv2BlueprintConfiguration,
    remoteSource: Tv2SourceMappingWithAudio
  ): Tv2RemoteAction {
    const sanitizedId: string = this.sanitizeStringForId(remoteSource.name)
    const partId: string = `remoteInsertActionPart_${sanitizedId}`
    const remotePieceInterface: Tv2PieceInterface
      = this.createRemotePieceInterface(configuration, remoteSource, partId)
    const partInterface: PartInterface = this.createPartInterface(
      partId,
      remoteSource
    )
    return {
      id: `remoteAsNextAction_${sanitizedId}`,
      name: `${remoteSource.name} PVW`,
      rank: 0,
      description: `Insert ${remoteSource.name} as next.`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [remotePieceInterface],
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REMOTE,
          source: remoteSource.name,
        },
        outputChannel: OutputChannel.PREVIEW,
      },
    }
  }

  private createRemotePieceInterface(
    configuration: Tv2BlueprintConfiguration,
    source: Tv2SourceMappingWithAudio,
    parentPartId: string
  ): Tv2PieceInterface {
    const videoMixerTimelineObjects: Tv2BlueprintTimelineObject[]
      = this.createVideoMixerTimelineObjects(source)
    const audioTimelineObjects: Tv2BlueprintTimelineObject[]
      = this.audioMixerTimelineObjectFactory.createTimelineObjectsForSource(
        configuration,
        source
      )

    const metadata: PieceMetadata = {
      playoutContent: {
        type: PlayoutContentType.REMOTE,
        source: source.name,
      },
      outputLayer: OutputLayer.PROGRAM,
      sisyfosPersistMetaData: {
        sisyfosLayers: source.audioLayers,
        wantsToPersistAudio: source.wantsToPersistAudio,
        acceptsPersistedAudio: source.acceptPersistAudio,
      },
    }

    return {
      id: `remoteAction_${this.sanitizeStringForId(source.id)}`,
      partId: parentPartId,
      rundownId: '',
      name: source.name,
      layer: Tv2PieceLayer.REMOTE,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      takenOffAirTimestamp: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      metadata,
      tags: [],
      isUnsynced: false,
      timelineObjects: [...videoMixerTimelineObjects, ...audioTimelineObjects],
    }
  }

  private createVideoMixerTimelineObjects(
    source: Tv2SourceMappingWithAudio
  ): Tv2BlueprintTimelineObject[] {
    const enable: TimelineEnable = { start: 0 }
    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(
        source.videoMixerSource,
        enable
      ),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(
        source.videoMixerSource,
        enable
      ),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(
        source.videoMixerSource,
        enable
      ),
    ]
  }

  private createPartInterface(
    partId: string,
    source: Tv2SourceMappingWithAudio
  ): PartInterface {
    return {
      id: partId,
      rundownId: '',
      name: source.name,
      segmentId: '',
      pieces: [],
      rank: -1,
      isOnAir: false,
      isNext: false,
      isUntimed: false,
      isUnsynced: false,
      inTransition: {
        blockTakeDuration: 0,
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0,
      },
      outTransition: {
        keepAliveDuration: 0,
      },
      disableNextInTransition: false,
    }
  }

  private createInsertRemoteAsOnAirActions(
    blueprintConfiguration: Tv2BlueprintConfiguration
  ): Tv2RemoteAction[] {
    return [
      ...blueprintConfiguration.studio.remoteSources,
      ...blueprintConfiguration.studio.feedSources,
    ].map(source =>
      this.createInsertRemoteAsOnAirAction(blueprintConfiguration, source)
    )
  }

  private createInsertRemoteAsOnAirAction(
    blueprintConfiguration: Tv2BlueprintConfiguration,
    remoteSource: Tv2SourceMappingWithAudio
  ): Tv2RemoteAction {
    const sanitizedId: string = this.sanitizeStringForId(remoteSource.name)
    const partId: string = `remoteInsertActionPart_${sanitizedId}`
    const remotePieceInterface: Tv2PieceInterface
      = this.createRemotePieceInterface(
        blueprintConfiguration,
        remoteSource,
        partId
      )
    const partInterface: PartInterface = this.createPartInterface(
      partId,
      remoteSource
    )
    return {
      id: `remoteAsOnAirAction_${sanitizedId}`,
      name: `${remoteSource.name} PGM`,
      rank: 0,
      description: `Insert and Take ${remoteSource.name}.`,
      type: PartActionType.INSERT_PART_AS_ON_AIR,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [remotePieceInterface],
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REMOTE,
          source: remoteSource.name,
        },
        outputChannel: OutputChannel.PROGRAM,
      },
    }
  }

  private createRecallLastPlannedRemoteAsNextAction(): Tv2RecallLastPlannedRemoteAsNextAction {
    return {
      id: 'recall_last_planned_remote_as_next_action',
      name: 'Recall last Live',
      rank: 0,
      description: 'Recalls the last live that has been on air.',
      type: PartActionType.INSERT_PART_AS_NEXT,
      metadata: {
        playoutContent: {
          type: PlayoutContentType.RECALLED,
          recalledType: PlayoutContentType.REMOTE,
        },
        outputChannel: OutputChannel.UNKNOWN,
        actionSubtype: Tv2ActionSubtype.RECALL_LAST_PLANNED_REMOTE,
      },
      data: {
        partInterface: {} as PartInterface, // Is determined when called.
        pieceInterfaces: [] as Tv2PieceInterface[], // Is determined when called.
      },
    }
  }

  private getRecallLastPlannedRemoteMutateActions(): MutateActionMethods[] {
    return [
      {
        type: MutateActionType.HISTORIC_PART,
        updateActionWithPartData:
          this.updateInsertLastPlannedRemoteToInputAction.bind(this),
        partPredicate: (part: Part) =>
          part.isPlanned && this.doesPartContainARemotePiece(part),
      },
    ]
  }

  private updateInsertLastPlannedRemoteToInputAction(
    action: Action,
    historicPart: Part
  ): Tv2RecallLastPlannedRemoteAsNextAction {
    const clonedPart: Part = historicPart.clone()
    clonedPart.reset()

    const partInterface: PartInterface = {
      id: `recall_last_planned_remote_part_${clonedPart.id}`,
      rundownId: '',
      name: clonedPart.name,
      segmentId: '',
      rank: -1,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      isUntimed: false,
      inTransition: {
        blockTakeDuration: 0,
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0,
      },
      outTransition: {
        keepAliveDuration: 0,
      },
      disableNextInTransition: false,
      pieces: [],
    }

    const pieceInterfaces: Tv2PieceInterface[] = historicPart
      .getPieces()
      .map(piece => ({
        id: `recall_last_planned_remote_piece_${piece.id}`,
        partId: partInterface.id,
        rundownId: '',
        name: piece.name,
        layer: piece.layer,
        pieceLifespan: piece.pieceLifespan,
        transitionType: piece.transitionType,
        isPlanned: false,
        start: piece.getStart(),
        duration: piece.getDuration(),
        takenOffAirTimestamp: 0,
        preRollDuration: piece.preRollDuration,
        postRollDuration: piece.postRollDuration,
        metadata: piece.metadata as PieceMetadata,
        tags: [],
        isUnsynced: false,
        timelineObjects: piece.getTimelineObjects(),
      }))

    const recallPlayoutContentPiece: Tv2PieceInterface = {
      id: 'recall_last_planned_remote_piece_recalled_remote',
      partId: partInterface.id,
      rundownId: '',
      name: 'Recalled remote',
      layer: 'recalled_layer',
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      takenOffAirTimestamp: 0,
      metadata: {
        playoutContent: {
          type: PlayoutContentType.RECALLED,
          recalledType: PlayoutContentType.REMOTE,
        },
      },
      tags: [],
      isUnsynced: false,
      timelineObjects: [],
    }
    pieceInterfaces.push(recallPlayoutContentPiece)

    const recallLastPlannedRemoteAction: Tv2RecallLastPlannedRemoteAsNextAction
      = action as Tv2RecallLastPlannedRemoteAsNextAction
    return {
      ...recallLastPlannedRemoteAction,
      data: {
        partInterface,
        pieceInterfaces,
      },
    }
  }

  private doesPartContainARemotePiece(part: Part): boolean {
    return part.getPieces().some(piece => this.isRemotePiece(piece))
  }

  private isRemotePiece(piece: Piece): boolean {
    return piece.metadata.playoutContent.type === PlayoutContentType.REMOTE
  }
}
