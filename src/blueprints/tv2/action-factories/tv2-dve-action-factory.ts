import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { Part, PartInterface } from '../../../model/entities/part'
import { DveBoxProperties, DveConfiguration } from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { TimelineObject } from '../../../model/entities/timeline-object'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  Tv2Action,
  Tv2ActionContentType,
  Tv2ActionSubtype,
  Tv2DveAction,
  Tv2DveInsertLastVideoClipInputAction,
  Tv2DveInsertSourceInputAction,
  Tv2DveInsertSourceInputMetadata,
  Tv2DveLayoutAction,
  Tv2RecallDveAction
} from '../value-objects/tv2-action'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { DveBoxInput, Tv2DveManifestData, Tv2VideoClipManifestData } from '../value-objects/tv2-action-manifest-data'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2UnavailableOperationException } from '../exceptions/tv2-unavailable-operation-exception'
import { A_B_SOURCE_INPUT_PLACEHOLDER } from '../value-objects/tv2-a-b-source-layers'
import { Tv2FileContent } from '../value-objects/tv2-content'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2CasparCgTimelineObjectFactory } from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { Tv2AssetPathHelper } from '../helpers/tv2-asset-path-helper'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'

const NUMBER_OF_DVE_BOXES: number = 4

// The "Layout" priority must be lower than the "Insert" priority for the inserted sources to "persist" through a Take.
const LAYOUT_TIMELINE_OBJECT_PRIORITY: number = 0.5
const INSERT_SOURCE_TO_INPUT_TIMELINE_OBJECT_PRIORITY: number = 1
const PLANNED_DVE_TIMELINE_OBJECT_PRIORITY: number = 1

const CAMERA_SOURCE_NAME: string = 'Camera'
const LIVE_SOURCE_NAME: string = 'Live'

const DVE_LOOKAHEAD_ID: string = 'dveLookahead'
const DVE_PROGRAM_ID: string = 'dveProgram'
const DVE_CLEAN_FEED_ID: string = 'dveCleanFeed'

export class Tv2DveActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly casparCgTimelineObjectFactory: Tv2CasparCgTimelineObjectFactory,
    private readonly assetPathHelper: Tv2AssetPathHelper
  ) {}


  public createDveActions(blueprintConfiguration: Tv2BlueprintConfiguration, dveManifestData: Tv2DveManifestData[]): Action[] {
    return [
      ...this.createDveLayoutActions(blueprintConfiguration),
      ...this.createInsertToInputActions(blueprintConfiguration),
      ...this.createDveActionsFromDveManifestData(blueprintConfiguration, dveManifestData),
      this.createRecallLastDveAction(),
      ...this.createInsertLastVideoClipToInputActions(blueprintConfiguration)
    ]
  }

  public isDveAction(action: Tv2Action): boolean {
    const actionSubtype: Tv2ActionSubtype | undefined = action.metadata.actionSubtype
    return actionSubtype !== undefined && [
      Tv2ActionSubtype.SPLIT_SCREEN_LAYOUT,
      Tv2ActionSubtype.SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT,
      Tv2ActionSubtype.RECALL_SPLIT_SCREEN,
      Tv2ActionSubtype.SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT
    ].includes(actionSubtype)
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    switch (action.metadata.actionSubtype) {
      case Tv2ActionSubtype.SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT: {
        return [{
          type: MutateActionType.PIECE,
          updateActionWithPiece: (action: Action, piece: Piece) => this.updateInsertToInputAction(action, piece),
          piecePredicate: (piece: Piece) => this.doesPieceHaveDveBoxesTimelineObject(piece)
        }]
      }
      case Tv2ActionSubtype.RECALL_SPLIT_SCREEN: {
        return [{
          type: MutateActionType.HISTORIC_PART,
          updateActionWithPartData: (action: Action, historicPart: Part, presentPart: Part | undefined) => this.updateRecallLastDveAction(action, historicPart, presentPart),
          partPredicate: (part: Part) => this.recallLastDvePartPredicate(part)
        }]
      }
      case Tv2ActionSubtype.SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT: {
        return [
          {
            type: MutateActionType.HISTORIC_PART,
            updateActionWithPartData: (action: Action, historicPart: Part, presentPart: Part | undefined) => this.updateInsertLastVideoClipToInputAction(action, historicPart, presentPart),
            partPredicate: (part: Part) => this.insertLastVideoClipToInputPredicate(part)
          },
          {
            type: MutateActionType.PIECE,
            updateActionWithPiece: (action: Action, piece: Piece) => this.updateInsertToInputAction(action, piece),
            piecePredicate: (piece: Piece) => this.doesPieceHaveDveBoxesTimelineObject(piece)
          }
        ]
      }
    }
    return []
  }

  private createDveLayoutActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2DveLayoutAction[] {
    return blueprintConfiguration.showStyle.dveConfigurations.map(dveConfiguration => {
      const partId: string = `dveLayoutInsertActionPart_${dveConfiguration.name}`

      const boxes: DveBoxProperties[] = Object.entries(dveConfiguration.layoutProperties.boxes).map(([, box]) => {
        return {
          ...box,
          source: blueprintConfiguration.studio.SwitcherSource.Default
        }
      })

      const timelineEnable: TimelineEnable = {
        start: 0
      }

      const dveSource: number = this.videoMixerTimelineObjectFactory.getDveSourceInput()

      const dveLayoutTimelineObjects: TimelineObject[] = [
        this.videoMixerTimelineObjectFactory.createDveBoxesTimelineObject(boxes, LAYOUT_TIMELINE_OBJECT_PRIORITY),
        this.videoMixerTimelineObjectFactory.createDvePropertiesTimelineObject(blueprintConfiguration, dveConfiguration.layoutProperties),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(DVE_PROGRAM_ID, dveSource, timelineEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(DVE_CLEAN_FEED_ID, dveSource, timelineEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(DVE_LOOKAHEAD_ID, dveSource, timelineEnable),
        this.casparCgTimelineObjectFactory.createDveKeyTimelineObject(this.assetPathHelper.joinAssetToFolder(dveConfiguration.key, blueprintConfiguration.studio.DVEFolder)),
        this.casparCgTimelineObjectFactory.createDveFrameTimelineObject(this.assetPathHelper.joinAssetToFolder(dveConfiguration.frame, blueprintConfiguration.studio.DVEFolder)),
        this.casparCgTimelineObjectFactory.createDveLocatorTimelineObject()
      ]

      const metadata: Tv2PieceMetadata = {
        type: Tv2PieceType.SPLIT_SCREEN,
        outputLayer: Tv2OutputLayer.PROGRAM,
        dve: {
          boxes,
          audioTimelineObjectsForBoxes: []
        }
      }

      return {
        id: `dveLayoutAsNextAction_${dveConfiguration.name}`,
        name: dveConfiguration.name,
        description: '',
        type: PartActionType.INSERT_PART_AS_NEXT,
        data: {
          partInterface: this.createPartInterface(partId, dveConfiguration),
          pieceInterfaces: [this.createDvePieceInterface(partId, dveConfiguration.name, metadata, dveLayoutTimelineObjects)]
        },
        metadata: {
          contentType: Tv2ActionContentType.SPLIT_SCREEN,
          actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_LAYOUT,
        }
      }
    })
  }

  private createPartInterface(partId: string, dveConfiguration: DveConfiguration): PartInterface {
    return {
      id: partId,
      name: dveConfiguration.name,
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

  private createDvePieceInterface(partId: string, name: string, metadata: Tv2PieceMetadata, timelineObjects: TimelineObject[]): PieceInterface {
    return {
      id: `${partId}_piece`,
      partId,
      name,
      layer: Tv2SourceLayer.DVE,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      isUnsynced: false,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      metadata,
      timelineObjects
    }
  }

  private createInsertToInputActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2DveInsertSourceInputAction[] {
    const cameraSources: Tv2SourceMappingWithSound[] = blueprintConfiguration.studio.SourcesCam.slice(0, 5)
    const liveSources: Tv2SourceMappingWithSound[] = blueprintConfiguration.studio.SourcesRM

    return [
      ...this.createInsertToInputActionsForSources(blueprintConfiguration, cameraSources, CAMERA_SOURCE_NAME),
      ...this.createInsertToInputActionsForSources(blueprintConfiguration, liveSources, LIVE_SOURCE_NAME)
    ]
  }

  private createInsertToInputActionsForSources(blueprintConfiguration: Tv2BlueprintConfiguration, sources: Tv2SourceMappingWithSound[], name: string): Tv2DveInsertSourceInputAction[] {
    const actions: Tv2DveInsertSourceInputAction[] = []
    for (let inputIndex = 0; inputIndex < NUMBER_OF_DVE_BOXES; inputIndex++) {
      const actionsForInput: Tv2DveInsertSourceInputAction[] = sources
        .map(source => {

          const audioTimelineObjects: TimelineObject[] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(blueprintConfiguration, source)

          return {
            id: `insert_${name}_${source.SourceName}_to_dve_input_${inputIndex}_action`,
            name: `Insert ${name} ${source.SourceName} in DVE input ${inputIndex}`,
            description: `Insert ${name} ${source.SourceName} in DVE input ${inputIndex}`,
            type: PieceActionType.REPLACE_PIECE,
            data: {
              pieceInterface: this.createEmptyPieceInterfaceToBeUpdatedByMutateActions()
            },
            metadata: {
              contentType: Tv2ActionContentType.SPLIT_SCREEN,
              actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT,
              inputIndex,
              videoMixerSource: source.SwitcherSource,
              audioTimelineObjects
            }
          }
        })

      actions.push(...actionsForInput)
    }
    return actions
  }

  private createEmptyPieceInterfaceToBeUpdatedByMutateActions(): PieceInterface {
    return {} as PieceInterface
  }

  private updateInsertToInputAction(action: Action, dvePieceFromRundown: Piece): Action {
    const pieceMetadata: Tv2PieceMetadata = dvePieceFromRundown.metadata as Tv2PieceMetadata
    if (!pieceMetadata.dve) {
      return action
    }

    const dveBoxTimelineObject: TimelineObject | undefined = dvePieceFromRundown.timelineObjects.find(timelineObject => timelineObject.layer === this.videoMixerTimelineObjectFactory.getDveBoxesLayer())
    if (!dveBoxTimelineObject) {
      return action
    }

    const timelineObjectsToKeep: TimelineObject[] = this.findTimelineObjectsToKeepForDveInsertSource(dvePieceFromRundown)

    const insertSourceInputMetadata: Tv2DveInsertSourceInputMetadata = action.metadata as Tv2DveInsertSourceInputMetadata

    pieceMetadata.dve.audioTimelineObjectsForBoxes[insertSourceInputMetadata.inputIndex] = insertSourceInputMetadata.audioTimelineObjects
    const audioTimelineObjects: TimelineObject[] = Object.values(pieceMetadata.dve.audioTimelineObjectsForBoxes).flat()

    const dveBoxes: DveBoxProperties[] = pieceMetadata.dve.boxes
    dveBoxes[insertSourceInputMetadata.inputIndex].source = insertSourceInputMetadata.videoMixerSource
    const dveBoxesTimelineObject: Tv2BlueprintTimelineObject = this.videoMixerTimelineObjectFactory.createDveBoxesTimelineObject(dveBoxes, INSERT_SOURCE_TO_INPUT_TIMELINE_OBJECT_PRIORITY)

    const timelineObjects: TimelineObject[] = [
      ...timelineObjectsToKeep,
      ...audioTimelineObjects,
      dveBoxesTimelineObject,
    ]

    if (insertSourceInputMetadata.videoClip) {
      dveBoxesTimelineObject.metaData = {
        ...dveBoxesTimelineObject.metaData,
        mediaPlayerSession: insertSourceInputMetadata.videoClip.mediaPlayerSession
      }
      for (const videoClipTimelineObject of insertSourceInputMetadata.videoClip.timelineObjects) {
        const indexOfObjectToReplace: number = timelineObjects.findIndex(to => to.id === videoClipTimelineObject.id)
        if (indexOfObjectToReplace >= 0) {
          timelineObjects.splice(indexOfObjectToReplace, 1)
        }
        timelineObjects.push(videoClipTimelineObject)
      }
    }

    const dveAction: Tv2DveInsertSourceInputAction = action as Tv2DveInsertSourceInputAction
    dveAction.data = {
      pieceInterface: this.createDvePieceInterface(dvePieceFromRundown.getPartId(), dvePieceFromRundown.name, pieceMetadata, timelineObjects)
    }
    return dveAction
  }

  private findTimelineObjectsToKeepForDveInsertSource(dvePieceFromRundown: Piece): TimelineObject[] {
    return dvePieceFromRundown.timelineObjects.filter(timelineObject => {
      const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
      return blueprintTimelineObject.content.deviceType !== this.audioTimelineObjectFactory.getAudioDeviceType()
        && blueprintTimelineObject.layer !== this.videoMixerTimelineObjectFactory.getDveBoxesLayer()
    })
  }

  private doesPieceHaveDveBoxesTimelineObject(piece: Piece): boolean {
    return piece.timelineObjects.some(timelineObject => timelineObject.layer === this.videoMixerTimelineObjectFactory.getDveBoxesLayer())
  }

  private createDveActionsFromDveManifestData(blueprintConfiguration: Tv2BlueprintConfiguration, dveManifestData: Tv2DveManifestData[]): Tv2DveAction[] {
    return dveManifestData.map(data => {
      const dveConfiguration: DveConfiguration | undefined = blueprintConfiguration.showStyle.dveConfigurations.find(dveConfiguration => dveConfiguration.name.toLowerCase() === data.template.toLowerCase())
      if (!dveConfiguration) {
        throw new Tv2MisconfigurationException(`No configured DVE found for planned DVE action ${data.name}`)
      }

      const partId: string = `plannedDveInsertActionPart_${dveConfiguration.name}`

      const boxes: DveBoxProperties[] = Object.entries(dveConfiguration.layoutProperties.boxes).map(([, box]) => {
        return {
          ...box,
          source: blueprintConfiguration.studio.SwitcherSource.Default
        }
      })

      const audioTimelineObjectsForBoxes: { [inputIndex: number]: TimelineObject[] } = {}
      data.sources.forEach((source: Tv2SourceMappingWithSound, input: DveBoxInput) => {
        const dveInputIndex: number = this.mapDveBoxInputToNumber(input)
        audioTimelineObjectsForBoxes[dveInputIndex] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(blueprintConfiguration, source)
        boxes[dveInputIndex].source = source.SwitcherSource
      })

      const audioTimelineObjects: TimelineObject[] = Object.values(audioTimelineObjectsForBoxes).flat()

      const metadata: Tv2PieceMetadata = {
        type: Tv2PieceType.SPLIT_SCREEN,
        dve: {
          boxes,
          audioTimelineObjectsForBoxes
        }
      }

      const videoSwitcherTimelineEnable: TimelineEnable = {
        start: 0
      }

      const dveSource: number = this.videoMixerTimelineObjectFactory.getDveSourceInput()

      const dveTimelineObjects: TimelineObject[] = [
        this.videoMixerTimelineObjectFactory.createDveBoxesTimelineObject(boxes, PLANNED_DVE_TIMELINE_OBJECT_PRIORITY),
        this.videoMixerTimelineObjectFactory.createDvePropertiesTimelineObject(blueprintConfiguration, dveConfiguration.layoutProperties),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(DVE_PROGRAM_ID, dveSource, videoSwitcherTimelineEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(DVE_CLEAN_FEED_ID, dveSource, videoSwitcherTimelineEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(DVE_LOOKAHEAD_ID, dveSource, videoSwitcherTimelineEnable),
        this.casparCgTimelineObjectFactory.createDveKeyTimelineObject(this.assetPathHelper.joinAssetToFolder(dveConfiguration.key, blueprintConfiguration.studio.DVEFolder)),
        this.casparCgTimelineObjectFactory.createDveFrameTimelineObject(this.assetPathHelper.joinAssetToFolder(dveConfiguration.frame, blueprintConfiguration.studio.DVEFolder)),
        this.casparCgTimelineObjectFactory.createDveLocatorTimelineObject(),
        ...audioTimelineObjects
      ]

      return {
        id: `plannedDveAsNextAction_${data.name.replace(/\s/g, '')}`,
        name: data.template,
        description: '',
        type: PartActionType.INSERT_PART_AS_NEXT,
        metadata: {
          contentType: Tv2ActionContentType.SPLIT_SCREEN
        },
        data: {
          partInterface: this.createPartInterface(partId, dveConfiguration),
          pieceInterfaces: [this.createDvePieceInterface(partId, dveConfiguration.name, metadata, dveTimelineObjects)]
        }
      }
    })
  }

  private mapDveBoxInputToNumber(dveBoxInput: DveBoxInput): number {
    switch (dveBoxInput) {
      case DveBoxInput.INPUT_1: {
        return 0
      }
      case DveBoxInput.INPUT_2: {
        return 1
      }
      case DveBoxInput.INPUT_3: {
        return 2
      }
      case DveBoxInput.INPUT_4: {
        return 3
      }
    }
  }

  private createRecallLastDveAction(): Tv2RecallDveAction {
    return {
      id: 'recall_last_dve_action',
      name: 'Recall DVE',
      description: 'Recalls the last planned DVE that has been on Air',
      type: PartActionType.INSERT_PART_AS_NEXT,
      metadata: {
        contentType: Tv2ActionContentType.SPLIT_SCREEN,
        actionSubtype: Tv2ActionSubtype.RECALL_SPLIT_SCREEN,
      },
      data: {
        partInterface: {} as PartInterface,
        pieceInterfaces: [] as PieceInterface[]
      }
    }
  }

  private updateRecallLastDveAction(action: Action, historicPart: Part, presentPart: Part | undefined): Action {
    if (!presentPart) {
      throw new Tv2UnavailableOperationException('Unable to recall DVE, since the DVE has since been updated!')
    }

    const clonedPart: Part = historicPart.clone()
    clonedPart.reset()
    const partInterface: PartInterface = {
      id: `recall_last_dve_part_${clonedPart.id}`,
      name: clonedPart.name,
      segmentId: '',
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
      disableNextInTransition: false,
      pieces: []
    }

    const pieceInterfaces: PieceInterface[] = historicPart.getPieces().map(piece => {
      return {
        id: `recall_last_dve_piece_${piece.id}`,
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
        timelineObjects: piece.timelineObjects
      }
    })

    const dveAction: Tv2RecallDveAction = action as Tv2RecallDveAction
    dveAction.data = {
      partInterface,
      pieceInterfaces
    }
    return dveAction
  }

  private recallLastDvePartPredicate(part: Part): boolean {
    return part.isPlanned && this.doesPartHavePiecesWithType(part, Tv2PieceType.SPLIT_SCREEN)
  }

  private doesPartHavePiecesWithType(part: Part, pieceType: Tv2PieceType): boolean {
    return part.getPieces().some(piece => {
      const metadata: Tv2PieceMetadata | undefined = piece.metadata as Tv2PieceMetadata | undefined
      if (!metadata) {
        return false
      }
      return metadata.type === pieceType
    })
  }

  private createInsertLastVideoClipToInputActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2DveInsertLastVideoClipInputAction[] {
    const actions: Tv2DveInsertLastVideoClipInputAction[] = []
    for (let inputIndex = 0; inputIndex < NUMBER_OF_DVE_BOXES; inputIndex++) {
      actions.push(this.createInsertLastVideoClipToInputAction(blueprintConfiguration, inputIndex, false))
      actions.push(this.createInsertLastVideoClipToInputAction(blueprintConfiguration, inputIndex, true))
    }

    return actions
  }

  private createInsertLastVideoClipToInputAction(blueprintConfiguration: Tv2BlueprintConfiguration, inputIndex: number, isVoiceOver: boolean): Tv2DveInsertLastVideoClipInputAction {
    const audioTimelineObjects: TimelineObject[] = this.audioTimelineObjectFactory.createVideoClipAudioTimelineObjects(blueprintConfiguration, {
      fileName: inputIndex,
      isVoiceOver
    } as unknown as Tv2VideoClipManifestData)

    return {
      id: `insert_last_video_clip_to_dve_input_${inputIndex}${isVoiceOver ? '_vo' : ''}_action`,
      name: `Insert last Video ${isVoiceOver ? ' Voice Over ' : ''} Clip in DVE input ${inputIndex}`,
      description: 'Insert last Video Clip in DVE input ${inputIndex}',
      type: PieceActionType.REPLACE_PIECE,
      metadata: {
        contentType: Tv2ActionContentType.SPLIT_SCREEN,
        actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT,
        inputIndex,
        videoMixerSource: A_B_SOURCE_INPUT_PLACEHOLDER,
        audioTimelineObjects,
        videoClip: {
          mediaPlayerSession: '', // Will be found on mutate.
          timelineObjects: [],
          isVoiceOver
        }
      },
      data: {
        pieceInterface: this.createEmptyPieceInterfaceToBeUpdatedByMutateActions()
      }
    }
  }

  private updateInsertLastVideoClipToInputAction(action: Action, historicPart: Part, presentPart: Part | undefined): Action {
    if (!presentPart) {
      throw new Tv2UnavailableOperationException('Unable to recall DVE, since the DVE has since been updated!')
    }

    const pieceWithMediaPlayerSession: Piece | undefined = historicPart.getPieces().find(this.hasMediaPlayerSessions)
    if (!pieceWithMediaPlayerSession || !pieceWithMediaPlayerSession.metadata) {
      return action
    }

    const pieceMetadata: Tv2PieceMetadata = pieceWithMediaPlayerSession.metadata as Tv2PieceMetadata
    if (!pieceMetadata.mediaPlayerSessions) {
      return action
    }

    const mediaPlayerSession: string = pieceMetadata.mediaPlayerSessions[0]
    const metadata: Tv2DveInsertSourceInputMetadata = action.metadata as Tv2DveInsertSourceInputMetadata

    metadata.audioTimelineObjects = this.addMediaPlayerSessionToTimelineObjects(mediaPlayerSession, metadata.audioTimelineObjects)

    const isVoiceOver: boolean = metadata.videoClip?.isVoiceOver ?? false
    const videoClipTimelineObject: Tv2BlueprintTimelineObject = this.createVideoClipTimelineObjectForPieceWithMediaPlayerSession(pieceWithMediaPlayerSession, mediaPlayerSession, isVoiceOver)

    metadata.videoClip = {
      mediaPlayerSession,
      timelineObjects: [videoClipTimelineObject],
      isVoiceOver
    }

    return action
  }

  private hasMediaPlayerSessions(piece: Piece): boolean {
    const pieceMetadata: Tv2PieceMetadata | undefined = piece.metadata as Tv2PieceMetadata | undefined
    if (!pieceMetadata) {
      return false
    }
    return !!pieceMetadata.mediaPlayerSessions && pieceMetadata.mediaPlayerSessions.length > 0
  }

  private createVideoClipTimelineObjectForPieceWithMediaPlayerSession(piece: Piece, mediaPlayerSession: string, isVoiceOver: boolean): Tv2BlueprintTimelineObject {
    const fileContent: Tv2FileContent = piece.content as Tv2FileContent

    const videoClipData: Tv2VideoClipManifestData = {
      name: '',
      fileName: fileContent.fileName,
      durationFromIngest: 0,
      adLibPix: isVoiceOver,
      isVoiceOver
    }

    const videoClipTimelineObject: Tv2BlueprintTimelineObject = this.casparCgTimelineObjectFactory.createVideoClipTimelineObject(videoClipData)
    videoClipTimelineObject.metaData = {
      ...videoClipTimelineObject.metaData,
      mediaPlayerSession
    }
    return videoClipTimelineObject
  }

  private addMediaPlayerSessionToTimelineObjects(mediaPlayerSession: string, timelineObjects: TimelineObject[]): TimelineObject[] {
    return timelineObjects.map(timelineObject => {
      const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
      blueprintTimelineObject.metaData = {
        ...blueprintTimelineObject.metaData,
        mediaPlayerSession
      }
      return blueprintTimelineObject
    })
  }

  private insertLastVideoClipToInputPredicate(part: Part): boolean {
    if (!part.isPlanned) {
      return false
    }

    const partIsDve: boolean = this.doesPartHavePiecesWithType(part, Tv2PieceType.SPLIT_SCREEN)
    if (partIsDve) { // If the Part is a DVE we can't use it find the Video Clip we want to insert into the DVE.
      return false
    }

    return this.doesPartHavePiecesWithType(part, Tv2PieceType.VIDEO_CLIP)
  }
}
