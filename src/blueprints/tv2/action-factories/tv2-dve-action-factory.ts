import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { PartInterface } from '../../../model/entities/part'
import { DveBoxProperties, DveConfiguration } from '../value-objects/tv2-show-style-blueprint-configuration'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2CasparCgLayer, Tv2GraphicsLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { TimelineObject } from '../../../model/entities/timeline-object'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  CasparCgMediaTimelineObject,
  CasparCgTemplateTimelineObject,
  CasparCgType
} from '../../timeline-state-resolver-types/caspar-cg-types'
import { DeviceType } from '../../../model/enums/device-type'
import {
  Tv2ActionContentType,
  Tv2DveInsertSourceInputAction,
  Tv2DveLayoutAction,
  Tv2PartAction,
  Tv2PieceAction,
  Tv2PlannedDveAction
} from '../value-objects/tv2-action'
import { Tv2BlueprintTimelineObject, Tv2PieceMetadata } from '../value-objects/tv2-metadata'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2SourceMappingWithSound } from '../value-objects/tv2-studio-blueprint-configuration'
import { DveBoxInput, Tv2DveManifestData } from '../value-objects/tv2-action-manifest-data'
import { MisconfigurationException } from '../../../model/exceptions/misconfiguration-exception'

const NUMBER_OF_DVE_BOXES: number = 4
const ATEM_SUPER_SOURCE_INDEX: number = 6000

// The "Layout" priority must be lower than the "Insert" priority for the inserted sources to "persist" through a Take.
const LAYOUT_TIMELINE_OBJECT_PRIORITY: number = 0.5
const INSERT_SOURCE_TO_INPUT_TIMELINE_OBJECT_PRIORITY: number = 1
const PLANNED_DVE_TIMELINE_OBJECT_PRIORITY: number = 1

const CAMERA_SOURCE_NAME: string = 'Camera'
const LIVE_SOURCE_NAME: string = 'Live'

export class Tv2DveActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory
  ) {}


  public createDveActions(blueprintConfiguration: Tv2BlueprintConfiguration, dveManifestData: Tv2DveManifestData[]): Action[] {
    return [
      ...this.createDveLayoutActions(blueprintConfiguration),
      ...this.createInsertToInputActions(blueprintConfiguration),
      ...this.createDveActionsFromDveManifestData(blueprintConfiguration, dveManifestData)
    ]
  }

  public isDveAction(action: Action): boolean {
    const tv2Action: Tv2PartAction | Tv2PieceAction = action as Tv2PartAction | Tv2PieceAction
    return [Tv2ActionContentType.DVE_LAYOUT, Tv2ActionContentType.DVE_INSERT_SOURCE_TO_INPUT].includes(tv2Action.metadata.contentType)
  }

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    const tv2Action: Tv2PartAction | Tv2PieceAction = action as Tv2PartAction | Tv2PieceAction
    switch (tv2Action.metadata.contentType) {
      case Tv2ActionContentType.DVE_INSERT_SOURCE_TO_INPUT: {
        return {
          type: MutateActionType.PIECE,
          updateActionWithPieceData: (action: Action, piece: Piece) => this.updateInsertToInputAction(action, piece),
          piecePredicate: (piece: Piece) => this.doesPieceHaveDveBoxesTimelineObject(piece)
        }
      }
    }
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
        start: blueprintConfiguration.studio.CasparPrerollDuration
      }

      const dveLayoutTimelineObjects: TimelineObject[] = [
        this.videoMixerTimelineObjectFactory.createDveBoxesTimelineObject(boxes, LAYOUT_TIMELINE_OBJECT_PRIORITY),
        this.videoMixerTimelineObjectFactory.createDvePropertiesTimelineObject(blueprintConfiguration, dveConfiguration.layoutProperties),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(ATEM_SUPER_SOURCE_INDEX, timelineEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(ATEM_SUPER_SOURCE_INDEX, timelineEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(ATEM_SUPER_SOURCE_INDEX, timelineEnable),
        this.createCasparCgDveKeyTimelineObject(this.joinAssetToFolder(blueprintConfiguration.studio.DVEFolder, dveConfiguration.key)),
        this.createCasparCgDveFrameTimelineObject(this.joinAssetToFolder(blueprintConfiguration.studio.DVEFolder, dveConfiguration.frame)),
        this.createCasparCgDveLocatorTimelineObject()
      ]

      const metadata: Tv2PieceMetadata = {
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
          contentType: Tv2ActionContentType.DVE_LAYOUT
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
      type: PieceType.DVE,
      layer: Tv2SourceLayer.DVE,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      metadata,
      timelineObjects
    }
  }

  // TODO: Move to CasparCgTimelineObjectFactory when implemented.
  private createCasparCgDveKeyTimelineObject(keyFilePath: string): CasparCgMediaTimelineObject {
    return {
      id: 'casparCg_dve_key',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.DVE_KEY,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file: keyFilePath,
        mixer: {
          keyer: true
        },
        loop: true
      }
    }
  }

  private createCasparCgDveFrameTimelineObject(frameFilePath: string): CasparCgMediaTimelineObject {
    return {
      id: 'casparCg_dve_frame',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2CasparCgLayer.DVE_FRAME,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.MEDIA,
        file: frameFilePath,
        loop: true
      }
    }
  }

  // TODO: Wait until SOF-1547 is implemented.
  private createCasparCgDveLocatorTimelineObject(): CasparCgTemplateTimelineObject {
    return {
      id: 'casparCg_locators',
      enable: {
        start: 0
      },
      priority: 1,
      layer: Tv2GraphicsLayer.GRAPHICS_LOCATORS,
      content: {
        deviceType: DeviceType.CASPAR_CG,
        type: CasparCgType.TEMPLATE
      }
    }
  }

  // Copied from Blueprints // TODO: Use the helper class André is making.
  private joinAssetToFolder(folder: string | undefined, assetFile: string): string {
    if (!folder) {
      return assetFile
    }

    // Replace every `\\` with `\`, then replace every `\` with `/`
    const folderWithForwardSlashes = folder.replace(/\\\\/g, '\\').replace(/\\/g, '/')
    const assetWithForwardSlashes = assetFile.replace(/\\\\/g, '\\').replace(/\\/g, '/')

    // Remove trailing slash from folder and leading slash from asset
    const folderWithoutTrailingSlashes = folderWithForwardSlashes.replace(/\/+$/, '')
    const assetFileWithoutLeadingSlashes = assetWithForwardSlashes.replace(/^\/+/, '')

    return `${folderWithoutTrailingSlashes}/${assetFileWithoutLeadingSlashes}`
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
            data: {} as PieceInterface,
            metadata: {
              contentType: Tv2ActionContentType.DVE_INSERT_SOURCE_TO_INPUT,
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

  private updateInsertToInputAction(action: Action, dvePieceFromRundown: Piece): Action {
    const metadata: Tv2PieceMetadata = dvePieceFromRundown.metadata as Tv2PieceMetadata
    if (!metadata.dve) {
      return action
    }

    const dveBoxTimelineObject: TimelineObject | undefined = dvePieceFromRundown.timelineObjects.find(timelineObject => timelineObject.layer === this.videoMixerTimelineObjectFactory.getDveBoxesLayer())
    if (!dveBoxTimelineObject) {
      return action
    }

    const timelineObjectsToKeep: TimelineObject[] = this.findTimelineObjectsToKeepForDveInsertSource(dvePieceFromRundown)

    const insertSourceInputAction: Tv2DveInsertSourceInputAction = action as Tv2DveInsertSourceInputAction

    metadata.dve.audioTimelineObjectsForBoxes[insertSourceInputAction.metadata.inputIndex] = insertSourceInputAction.metadata.audioTimelineObjects
    const audioTimelineObjects: TimelineObject[] = Object.values(metadata.dve.audioTimelineObjectsForBoxes).flat()

    const dveBoxes: DveBoxProperties[] = metadata.dve.boxes
    dveBoxes[insertSourceInputAction.metadata.inputIndex].source = insertSourceInputAction.metadata.videoMixerSource
    const dveBoxesTimelineObject: TimelineObject = this.videoMixerTimelineObjectFactory.createDveBoxesTimelineObject(dveBoxes, INSERT_SOURCE_TO_INPUT_TIMELINE_OBJECT_PRIORITY)

    const timelineObjects: TimelineObject[] = [
      ...timelineObjectsToKeep,
      ...audioTimelineObjects,
      dveBoxesTimelineObject
    ]

    const dveAction: Tv2DveInsertSourceInputAction = action as Tv2DveInsertSourceInputAction
    dveAction.data = this.createDvePieceInterface(dvePieceFromRundown.getPartId(), dvePieceFromRundown.name, metadata, timelineObjects)
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

  private createDveActionsFromDveManifestData(blueprintConfiguration: Tv2BlueprintConfiguration, dveManifestData: Tv2DveManifestData[]): Tv2PlannedDveAction[] {
    return dveManifestData.map(data => {
      const dveConfiguration: DveConfiguration | undefined = blueprintConfiguration.showStyle.dveConfigurations.find(dveConfiguration => dveConfiguration.name.toLowerCase() === data.template.toLowerCase())
      if (!dveConfiguration) {
        throw new MisconfigurationException(`No configured DVE found for planned DVE action ${data.name}`)
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
        dve: {
          boxes,
          audioTimelineObjectsForBoxes
        }
      }

      const videoSwitcherTimelineEnable: TimelineEnable = {
        start: 0
      }

      const dveTimelineObjects: TimelineObject[] = [
        this.videoMixerTimelineObjectFactory.createDveBoxesTimelineObject(boxes, PLANNED_DVE_TIMELINE_OBJECT_PRIORITY),
        this.videoMixerTimelineObjectFactory.createDvePropertiesTimelineObject(blueprintConfiguration, dveConfiguration.layoutProperties),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(ATEM_SUPER_SOURCE_INDEX, videoSwitcherTimelineEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(ATEM_SUPER_SOURCE_INDEX, videoSwitcherTimelineEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(ATEM_SUPER_SOURCE_INDEX, videoSwitcherTimelineEnable),
        this.createCasparCgDveKeyTimelineObject(this.joinAssetToFolder(blueprintConfiguration.studio.DVEFolder, dveConfiguration.key)),
        this.createCasparCgDveFrameTimelineObject(this.joinAssetToFolder(blueprintConfiguration.studio.DVEFolder, dveConfiguration.frame)),
        this.createCasparCgDveLocatorTimelineObject(),
        ...audioTimelineObjects
      ]

      return {
        id: `plannedDveAsNextAction_${data.name.replace(/\s/g, '')}`,
        name: data.template,
        description: '',
        type: PartActionType.INSERT_PART_AS_NEXT,
        metadata: {
          contentType: Tv2ActionContentType.DVE
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
}
