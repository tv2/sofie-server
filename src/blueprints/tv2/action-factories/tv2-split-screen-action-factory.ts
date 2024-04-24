import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Piece } from '../../../model/entities/piece'
import { Part, PartInterface } from '../../../model/entities/part'
import {
  SplitScreenBoxProperties,
  SplitScreenConfiguration
} from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  Tv2Action,
  Tv2ActionContentType,
  Tv2ActionSubtype,
  Tv2RecallSplitScreenAction,
  Tv2SplitScreenAction,
  Tv2SplitScreenInsertLastVideoClipInputAction,
  Tv2SplitScreenInsertSourceInputAction,
  Tv2SplitScreenInsertSourceInputMetadata,
  Tv2SplitScreenLayoutAction
} from '../value-objects/tv2-action'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import {
  SplitScreenBoxInput,
  Tv2SplitScreenManifestData,
  Tv2VideoClipManifestData
} from '../value-objects/tv2-action-manifest-data'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2UnavailableOperationException } from '../exceptions/tv2-unavailable-operation-exception'
import { A_B_SOURCE_INPUT_PLACEHOLDER } from '../value-objects/tv2-a-b-source-layers'
import { Tv2FileContent } from '../value-objects/tv2-content'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2AssetPathHelper } from '../helpers/tv2-asset-path-helper'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import { Tv2AudioMode } from '../enums/tv2-audio-mode'
import {
  Tv2GraphicsSplitScreenTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-graphics-split-screen-timeline-object-factory'
import {
  Tv2VideoClipTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-clip-timeline-object-factory'
import { Tv2ActionManifestMapper } from '../helpers/tv2-action-manifest-mapper'
import { Tv2ActionManifest } from '../value-objects/tv2-action-manifest'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'

const NUMBER_OF_SPLIT_SCREEN_BOXES: number = 4

// The "Layout" priority must be lower than the "Insert" priority for the inserted sources to "persist" through a Take.
const LAYOUT_TIMELINE_OBJECT_PRIORITY: number = 0.5
const INSERT_SOURCE_TO_INPUT_TIMELINE_OBJECT_PRIORITY: number = 1
const PLANNED_SPLIT_SCREEN_TIMELINE_OBJECT_PRIORITY: number = 1

const CAMERA_SOURCE_NAME: string = 'Camera'
const LIVE_SOURCE_NAME: string = 'Live'
const FEED_SOURCE_NAME: string = 'Feed'
const REPLAY_SOURCE_NAME: string = 'Replay'

export class Tv2SplitScreenActionFactory {

  constructor(
    private readonly actionManifestMapper: Tv2ActionManifestMapper,
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly graphicsSplitScreenTimelineObjectFactory: Tv2GraphicsSplitScreenTimelineObjectFactory,
    private readonly videoClipTimelineObjectFactory: Tv2VideoClipTimelineObjectFactory,
    private readonly assetPathHelper: Tv2AssetPathHelper
  ) {}


  public createSplitScreenActions(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2ActionManifest[]): Action[] {
    const splitScreenManifestData: Tv2SplitScreenManifestData[] = this.actionManifestMapper.mapToSplitScreenManifestData(blueprintConfiguration, actionManifests)
    return [
      ...this.createSplitScreenLayoutActions(blueprintConfiguration),
      ...this.createInsertSplitScreenInputActions(blueprintConfiguration),
      ...this.createSplitScreenActionsFromSplitScreenManifestData(blueprintConfiguration, splitScreenManifestData),
      this.createRecallLastSplitScreenAction(),
      ...this.createInsertLastVideoClipToInputActions(blueprintConfiguration)
    ]
  }

  public isSplitScreenAction(action: Tv2Action): boolean {
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
          piecePredicate: (piece: Piece) => this.doesPieceHaveSplitScreenBoxesTimelineObject(piece)
        }]
      }
      case Tv2ActionSubtype.RECALL_SPLIT_SCREEN: {
        return [{
          type: MutateActionType.HISTORIC_PART,
          updateActionWithPartData: (action: Action, historicPart: Part, presentPart: Part | undefined) => this.updateRecallLastPlannedSplitScreenAction(action, historicPart, presentPart),
          partPredicate: (part: Part) => this.recallLastPlannedSplitScreenPartPredicate(part)
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
            piecePredicate: (piece: Piece) => this.doesPieceHaveSplitScreenBoxesTimelineObject(piece)
          }
        ]
      }
    }
    return []
  }

  private createSplitScreenLayoutActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2SplitScreenLayoutAction[] {
    return blueprintConfiguration.showStyle.splitScreenConfigurations.map(splitScreenConfiguration => {
      const partId: string = `splitScreenLayoutInsertActionPart_${splitScreenConfiguration.name}`

      const boxes: SplitScreenBoxProperties[] = Object.entries(splitScreenConfiguration.layoutProperties.boxes).map(([, box]) => {
        return {
          ...box,
          source: blueprintConfiguration.studio.videoMixerBasicConfiguration.defaultVideoMixerSource
        }
      })

      const timelineEnable: TimelineEnable = {
        start: 0
      }

      const splitScreenSource: number = this.videoMixerTimelineObjectFactory.getSplitScreenSourceInput()

      const splitScreenLayoutTimelineObjects: Tv2BlueprintTimelineObject[] = [
        this.videoMixerTimelineObjectFactory.createSplitScreenBoxesTimelineObject(boxes, LAYOUT_TIMELINE_OBJECT_PRIORITY),
        this.videoMixerTimelineObjectFactory.createSplitScreenPropertiesTimelineObject(blueprintConfiguration, splitScreenConfiguration.layoutProperties),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(splitScreenSource, timelineEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(splitScreenSource, timelineEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(splitScreenSource, timelineEnable),
        this.graphicsSplitScreenTimelineObjectFactory.createSplitScreenKeyTimelineObject(this.assetPathHelper.joinAssetToFolder(splitScreenConfiguration.key, blueprintConfiguration.studio.splitScreenFolder?.name)),
        this.graphicsSplitScreenTimelineObjectFactory.createSplitScreenFrameTimelineObject(this.assetPathHelper.joinAssetToFolder(splitScreenConfiguration.frame, blueprintConfiguration.studio.splitScreenFolder?.name)),
        this.graphicsSplitScreenTimelineObjectFactory.createSplitScreenLocatorTimelineObject(blueprintConfiguration.showStyle.selectedGraphicsSetup, splitScreenConfiguration)
      ]

      const metadata: Tv2PieceMetadata = {
        type: Tv2PieceType.SPLIT_SCREEN,
        outputLayer: Tv2OutputLayer.PROGRAM,
        splitScreen: {
          boxes,
          audioTimelineObjectsForBoxes: []
        }
      }

      return {
        id: `splitScreenLayoutAsNextAction_${splitScreenConfiguration.name}`,
        name: splitScreenConfiguration.name,
        description: '',
        type: PartActionType.INSERT_PART_AS_NEXT,
        data: {
          partInterface: this.createPartInterface(partId, splitScreenConfiguration),
          pieceInterfaces: [this.createSplitScreenPieceInterface(partId, splitScreenConfiguration.name, metadata, splitScreenLayoutTimelineObjects)]
        },
        metadata: {
          contentType: Tv2ActionContentType.SPLIT_SCREEN,
          actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_LAYOUT,
        }
      }
    })
  }

  private createPartInterface(partId: string, splitScreenConfiguration: SplitScreenConfiguration): PartInterface {
    return {
      id: partId,
      rundownId: '',
      name: splitScreenConfiguration.name,
      segmentId: '',
      pieces: [],
      rank: -1,
      isOnAir: false,
      isNext: false,
      isUntimed: false,
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

  private createSplitScreenPieceInterface(partId: string, name: string, metadata: Tv2PieceMetadata, timelineObjects: Tv2BlueprintTimelineObject[]): Tv2PieceInterface {
    return {
      id: `${partId}_piece`,
      partId,
      name,
      layer: Tv2SourceLayer.SPLIT_SCREEN,
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

  private createInsertSplitScreenInputActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2SplitScreenInsertSourceInputAction[] {
    const cameraSources: Tv2SourceMappingWithSound[] = blueprintConfiguration.studio.cameraSources.slice(0, 5)
    const liveSources: Tv2SourceMappingWithSound[] = blueprintConfiguration.studio.remoteSources
    const feedSources: Tv2SourceMappingWithSound[] = blueprintConfiguration.studio.feedSources
    const replaySources: Tv2SourceMappingWithSound[] = blueprintConfiguration.studio.replaySources
    const replaySourcesWithoutVoiceOver: Tv2SourceMappingWithSound[] = replaySources.filter(replaySource => !/EPSIO/i.test(replaySource.name))

    return [
      ...this.createInsertToInputActionsForSources(blueprintConfiguration, cameraSources, CAMERA_SOURCE_NAME),
      ...this.createInsertToInputActionsForSources(blueprintConfiguration, liveSources, LIVE_SOURCE_NAME),
      ...this.createInsertToInputActionsForSources(blueprintConfiguration, feedSources, FEED_SOURCE_NAME),
      ...this.createInsertToInputActionsForSources(blueprintConfiguration, replaySources, `${REPLAY_SOURCE_NAME} VO`, Tv2AudioMode.VOICE_OVER),
      ...this.createInsertToInputActionsForSources(blueprintConfiguration, replaySourcesWithoutVoiceOver, REPLAY_SOURCE_NAME, Tv2AudioMode.FULL)
    ]
  }

  private createInsertToInputActionsForSources(blueprintConfiguration: Tv2BlueprintConfiguration, sources: Tv2SourceMappingWithSound[], name: string, audioMode: Tv2AudioMode = Tv2AudioMode.FULL): Tv2SplitScreenInsertSourceInputAction[] {
    const actions: Tv2SplitScreenInsertSourceInputAction[] = []
    for (let inputIndex = 0; inputIndex < NUMBER_OF_SPLIT_SCREEN_BOXES; inputIndex++) {
      const actionsForInput: Tv2SplitScreenInsertSourceInputAction[] = sources
        .map(source => {
          const audioTimelineObjects: Tv2BlueprintTimelineObject[] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(blueprintConfiguration, source, audioMode)

          return {
            id: `insert_${this.replaceWhiteSpaceWithUnderscore(name)}_${this.replaceWhiteSpaceWithUnderscore(source.name)}_to_split_screen_input_${this.createDisplayIndex(inputIndex)}_action`,
            name: `Insert ${name} ${source.name} in DVE input ${this.createDisplayIndex(inputIndex)}`,
            description: `Insert ${name} ${source.name} in DVE input ${this.createDisplayIndex(inputIndex)}`,
            type: PieceActionType.REPLACE_PIECE,
            data: {
              pieceInterface: this.createEmptyPieceInterfaceToBeUpdatedByMutateActions()
            },
            metadata: {
              contentType: Tv2ActionContentType.SPLIT_SCREEN,
              actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT,
              inputIndex,
              videoMixerSource: source.videoMixerSource,
              audioTimelineObjects
            }
          }
        })

      actions.push(...actionsForInput)
    }
    return actions
  }

  private createDisplayIndex(index: number): number {
    return index + 1
  }

  private replaceWhiteSpaceWithUnderscore(value: string): string {
    return value.replaceAll(' ', '_')
  }

  private createEmptyPieceInterfaceToBeUpdatedByMutateActions(): Tv2PieceInterface {
    return {} as Tv2PieceInterface
  }

  private updateInsertToInputAction(action: Action, splitScreenPieceFromRundown: Piece): Action {
    const pieceMetadata: Tv2PieceMetadata = splitScreenPieceFromRundown.metadata as Tv2PieceMetadata
    if (!pieceMetadata.splitScreen) {
      return action
    }

    const splitScreenBoxTimelineObject: Tv2BlueprintTimelineObject | undefined = splitScreenPieceFromRundown.timelineObjects
      .find(timelineObject => timelineObject.layer === this.videoMixerTimelineObjectFactory.getSplitScreenBoxesLayer()) as Tv2BlueprintTimelineObject
    if (!splitScreenBoxTimelineObject) {
      return action
    }

    const timelineObjectsToKeep: Tv2BlueprintTimelineObject[] = this.findTimelineObjectsToKeepForSplitScreenInsertSource(splitScreenPieceFromRundown)

    const insertSourceInputMetadata: Tv2SplitScreenInsertSourceInputMetadata = action.metadata as Tv2SplitScreenInsertSourceInputMetadata

    pieceMetadata.splitScreen.audioTimelineObjectsForBoxes[insertSourceInputMetadata.inputIndex] = insertSourceInputMetadata.audioTimelineObjects
    const audioTimelineObjects: Tv2BlueprintTimelineObject[] = Object.values(pieceMetadata.splitScreen.audioTimelineObjectsForBoxes).flat()

    const splitScreenBoxes: SplitScreenBoxProperties[] = pieceMetadata.splitScreen.boxes
    splitScreenBoxes[insertSourceInputMetadata.inputIndex].source = insertSourceInputMetadata.videoMixerSource
    const splitScreenBoxesTimelineObject: Tv2BlueprintTimelineObject = this.videoMixerTimelineObjectFactory.createSplitScreenBoxesTimelineObject(splitScreenBoxes, INSERT_SOURCE_TO_INPUT_TIMELINE_OBJECT_PRIORITY)

    const timelineObjects: Tv2BlueprintTimelineObject[] = [
      ...timelineObjectsToKeep,
      ...audioTimelineObjects,
      splitScreenBoxesTimelineObject,
    ]

    if (insertSourceInputMetadata.videoClip) {
      splitScreenBoxesTimelineObject.metaData = {
        ...splitScreenBoxesTimelineObject.metaData,
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

    const splitScreenAction: Tv2SplitScreenInsertSourceInputAction = action as Tv2SplitScreenInsertSourceInputAction
    splitScreenAction.data = {
      pieceInterface: this.createSplitScreenPieceInterface(splitScreenPieceFromRundown.getPartId(), splitScreenPieceFromRundown.name, pieceMetadata, timelineObjects)
    }
    return splitScreenAction
  }

  private findTimelineObjectsToKeepForSplitScreenInsertSource(splitScreenPieceFromRundown: Piece): Tv2BlueprintTimelineObject[] {
    return splitScreenPieceFromRundown.timelineObjects.filter(timelineObject => {
      const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
      return blueprintTimelineObject.content.deviceType !== this.audioTimelineObjectFactory.getAudioDeviceType()
        && blueprintTimelineObject.layer !== this.videoMixerTimelineObjectFactory.getSplitScreenBoxesLayer()
    }) as Tv2BlueprintTimelineObject[]
  }

  private doesPieceHaveSplitScreenBoxesTimelineObject(piece: Piece): boolean {
    return piece.timelineObjects.some(timelineObject => timelineObject.layer === this.videoMixerTimelineObjectFactory.getSplitScreenBoxesLayer())
  }

  private createSplitScreenActionsFromSplitScreenManifestData(blueprintConfiguration: Tv2BlueprintConfiguration, splitScreenManifestData: Tv2SplitScreenManifestData[]): Tv2SplitScreenAction[] {
    return splitScreenManifestData.map(data => {
      const splitScreenConfiguration: SplitScreenConfiguration | undefined = blueprintConfiguration.showStyle.splitScreenConfigurations.find(splitScreenConfiguration => splitScreenConfiguration.name.toLowerCase() === data.template.toLowerCase())
      if (!splitScreenConfiguration) {
        throw new Tv2MisconfigurationException(`No configured split screen found for planned split screen action ${data.name}`)
      }

      const partId: string = `plannedSplitScreenInsertActionPart_${splitScreenConfiguration.name}`

      const boxes: SplitScreenBoxProperties[] = Object.entries(splitScreenConfiguration.layoutProperties.boxes).map(([, box]) => {
        return {
          ...box,
          source: blueprintConfiguration.studio.videoMixerBasicConfiguration.defaultVideoMixerSource
        }
      })

      const audioTimelineObjectsForBoxes: { [inputIndex: number]: Tv2BlueprintTimelineObject[] } = {}
      data.sources.forEach((source: Tv2SourceMappingWithSound, input: SplitScreenBoxInput) => {
        const splitScreenInputIndex: number = this.mapSplitScreenBoxInputToNumber(input)
        audioTimelineObjectsForBoxes[splitScreenInputIndex] = this.audioTimelineObjectFactory.createTimelineObjectsForSource(blueprintConfiguration, source)
        boxes[splitScreenInputIndex].source = source.videoMixerSource
      })

      const audioTimelineObjects: Tv2BlueprintTimelineObject[] = Object.values(audioTimelineObjectsForBoxes).flat()

      const metadata: Tv2PieceMetadata = {
        type: Tv2PieceType.SPLIT_SCREEN,
        outputLayer: Tv2OutputLayer.PROGRAM,
        splitScreen: {
          boxes,
          audioTimelineObjectsForBoxes
        }
      }

      const videoSwitcherTimelineEnable: TimelineEnable = {
        start: 0
      }

      const splitScreenSource: number = this.videoMixerTimelineObjectFactory.getSplitScreenSourceInput()

      const splitScreenTimelineObjects: Tv2BlueprintTimelineObject[] = [
        this.videoMixerTimelineObjectFactory.createSplitScreenBoxesTimelineObject(boxes, PLANNED_SPLIT_SCREEN_TIMELINE_OBJECT_PRIORITY),
        this.videoMixerTimelineObjectFactory.createSplitScreenPropertiesTimelineObject(blueprintConfiguration, splitScreenConfiguration.layoutProperties),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(splitScreenSource, videoSwitcherTimelineEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(splitScreenSource, videoSwitcherTimelineEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(splitScreenSource, videoSwitcherTimelineEnable),
        this.graphicsSplitScreenTimelineObjectFactory.createSplitScreenKeyTimelineObject(this.assetPathHelper.joinAssetToFolder(splitScreenConfiguration.key, blueprintConfiguration.studio.splitScreenFolder?.name)),
        this.graphicsSplitScreenTimelineObjectFactory.createSplitScreenFrameTimelineObject(this.assetPathHelper.joinAssetToFolder(splitScreenConfiguration.frame, blueprintConfiguration.studio.splitScreenFolder?.name)),
        this.graphicsSplitScreenTimelineObjectFactory.createSplitScreenLocatorTimelineObject(blueprintConfiguration.showStyle.selectedGraphicsSetup, splitScreenConfiguration, data.locatorLabels),
        ...audioTimelineObjects
      ]

      return {
        id: `plannedSplitScreenAsNextAction_${data.name.replace(/\s/g, '')}`,
        name: data.template,
        rundownId: data.rundownId,
        description: '',
        type: PartActionType.INSERT_PART_AS_NEXT,
        metadata: {
          contentType: Tv2ActionContentType.SPLIT_SCREEN
        },
        data: {
          partInterface: this.createPartInterface(partId, splitScreenConfiguration),
          pieceInterfaces: [this.createSplitScreenPieceInterface(partId, splitScreenConfiguration.name, metadata, splitScreenTimelineObjects)]
        }
      }
    })
  }

  private mapSplitScreenBoxInputToNumber(splitScreenBoxInput: SplitScreenBoxInput): number {
    switch (splitScreenBoxInput) {
      case SplitScreenBoxInput.INPUT_1: {
        return 0
      }
      case SplitScreenBoxInput.INPUT_2: {
        return 1
      }
      case SplitScreenBoxInput.INPUT_3: {
        return 2
      }
      case SplitScreenBoxInput.INPUT_4: {
        return 3
      }
    }
  }

  private createRecallLastSplitScreenAction(): Tv2RecallSplitScreenAction {
    return {
      id: 'recall_last_split_screen_action',
      name: 'Recall DVE',
      description: 'Recalls the last planned DVE that has been on Air',
      type: PartActionType.INSERT_PART_AS_NEXT,
      metadata: {
        contentType: Tv2ActionContentType.SPLIT_SCREEN,
        actionSubtype: Tv2ActionSubtype.RECALL_SPLIT_SCREEN,
      },
      data: {
        partInterface: {} as PartInterface,
        pieceInterfaces: [] as Tv2PieceInterface[]
      }
    }
  }

  private updateRecallLastPlannedSplitScreenAction(action: Action, historicPart: Part, presentPart: Part | undefined): Action {
    if (!presentPart) {
      throw new Tv2UnavailableOperationException('Unable to recall split screen, since the split screen has since been updated!')
    }

    const clonedPart: Part = historicPart.clone()
    clonedPart.reset()
    const partInterface: PartInterface = {
      id: `recall_last_planned_split_screen_part_${clonedPart.id}`,
      rundownId: '',
      name: clonedPart.name,
      segmentId: '',
      rank: -1,
      isOnAir: false,
      isNext: false,
      isUntimed: false,
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

    const pieceInterfaces: Tv2PieceInterface[] = historicPart.getPieces().map(piece => {
      return {
        id: `recall_last_split_screen_piece_${piece.id}`,
        ingestedPieceId: '',
        ingestedPartId: '',
        partId: partInterface.id,
        name: piece.name,
        layer: piece.layer,
        pieceLifespan: piece.pieceLifespan,
        transitionType: piece.transitionType,
        isPlanned: false,
        start: piece.getStart(),
        duration: piece.getDuration(),
        preRollDuration: piece.preRollDuration,
        postRollDuration: piece.postRollDuration,
        metadata: piece.metadata as Tv2PieceMetadata,
        tags: [],
        isUnsynced: false,
        timelineObjects: piece.timelineObjects
      }
    })

    const splitScreenAction: Tv2RecallSplitScreenAction = action as Tv2RecallSplitScreenAction
    splitScreenAction.data = {
      partInterface,
      pieceInterfaces
    }
    return splitScreenAction
  }

  private recallLastPlannedSplitScreenPartPredicate(part: Part): boolean {
    return part.isPlanned && this.doesPartHavePieceWithType(part, Tv2PieceType.SPLIT_SCREEN)
  }

  private doesPartHavePieceWithType(part: Part, pieceType: Tv2PieceType): boolean {
    return part.getPieces().some(piece => {
      const metadata: Tv2PieceMetadata | undefined = piece.metadata as Tv2PieceMetadata | undefined
      return metadata?.type === pieceType
    })
  }

  private createInsertLastVideoClipToInputActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2SplitScreenInsertLastVideoClipInputAction[] {
    const actions: Tv2SplitScreenInsertLastVideoClipInputAction[] = []
    for (let inputIndex = 0; inputIndex < NUMBER_OF_SPLIT_SCREEN_BOXES; inputIndex++) {
      actions.push(this.createInsertLastVideoClipToInputAction(blueprintConfiguration, this.createDisplayIndex(inputIndex), Tv2AudioMode.FULL))
      actions.push(this.createInsertLastVideoClipToInputAction(blueprintConfiguration, this.createDisplayIndex(inputIndex), Tv2AudioMode.VOICE_OVER))
    }

    return actions
  }

  private createInsertLastVideoClipToInputAction(blueprintConfiguration: Tv2BlueprintConfiguration, inputIndex: number, audioMode: Tv2AudioMode): Tv2SplitScreenInsertLastVideoClipInputAction {
    const audioTimelineObjects: Tv2BlueprintTimelineObject[] = this.audioTimelineObjectFactory.createVideoClipAudioTimelineObjects(blueprintConfiguration, {
      fileName: inputIndex,
      audioMode
    } as unknown as Tv2VideoClipManifestData)

    return {
      id: `insert_last_video_clip_to_split_screen_input_${inputIndex}${audioMode === Tv2AudioMode.VOICE_OVER ? '_vo' : ''}_action`,
      name: `Insert last Video ${audioMode === Tv2AudioMode.VOICE_OVER ? 'Voice Over ' : ''}Clip in DVE input ${inputIndex}`,
      description: `Insert last Video Clip in DVE input ${inputIndex}`,
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
          audioMode
        }
      },
      data: {
        pieceInterface: this.createEmptyPieceInterfaceToBeUpdatedByMutateActions()
      }
    }
  }

  private updateInsertLastVideoClipToInputAction(action: Action, historicPart: Part, presentPart: Part | undefined): Action {
    if (!presentPart) {
      throw new Tv2UnavailableOperationException('Unable to recall split screen, since the split screen has since been updated!')
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
    const metadata: Tv2SplitScreenInsertSourceInputMetadata = action.metadata as Tv2SplitScreenInsertSourceInputMetadata

    metadata.audioTimelineObjects = this.addMediaPlayerSessionToTimelineObjects(mediaPlayerSession, metadata.audioTimelineObjects)

    const audioMode: Tv2AudioMode = metadata.videoClip?.audioMode ?? Tv2AudioMode.FULL
    const videoClipTimelineObject: Tv2BlueprintTimelineObject = this.createVideoClipTimelineObjectForPieceWithMediaPlayerSession(pieceWithMediaPlayerSession, mediaPlayerSession, audioMode)

    metadata.videoClip = {
      mediaPlayerSession,
      timelineObjects: [videoClipTimelineObject],
      audioMode
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

  private createVideoClipTimelineObjectForPieceWithMediaPlayerSession(piece: Piece, mediaPlayerSession: string, audioMode: Tv2AudioMode): Tv2BlueprintTimelineObject {
    const fileContent: Tv2FileContent = piece.content as Tv2FileContent

    const videoClipData: Tv2VideoClipManifestData = {
      name: '',
      fileName: fileContent.fileName,
      durationFromIngest: 0,
      adLibPix: audioMode === Tv2AudioMode.VOICE_OVER,
      audioMode
    }

    const videoClipTimelineObject: Tv2BlueprintTimelineObject = this.videoClipTimelineObjectFactory.createVideoClipTimelineObject(videoClipData)
    videoClipTimelineObject.metaData = {
      ...videoClipTimelineObject.metaData,
      mediaPlayerSession
    }
    return videoClipTimelineObject
  }

  private addMediaPlayerSessionToTimelineObjects(mediaPlayerSession: string, timelineObjects: Tv2BlueprintTimelineObject[]): Tv2BlueprintTimelineObject[] {
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

    const isSplitScreenPart: boolean = this.doesPartHavePieceWithType(part, Tv2PieceType.SPLIT_SCREEN)
    if (isSplitScreenPart) { // If the Part is a split screen we can't use it find the Video Clip we want to insert into the split screen.
      return false
    }

    return this.doesPartHavePieceWithType(part, Tv2PieceType.VIDEO_CLIP)
  }
}
