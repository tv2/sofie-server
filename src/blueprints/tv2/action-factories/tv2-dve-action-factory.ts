import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, PartAction } from '../../../model/entities/action'
import { PartActionType } from '../../../model/enums/action-type'
import { PieceInterface } from '../../../model/entities/piece'
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

const ATEM_SUPER_SOURCE_INDEX: number = 6000

export class Tv2DveActionFactory {

  constructor(
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory
  ) {}


  public createDveActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return this.createDveLayoutActions(blueprintConfiguration)
  }

  private createDveLayoutActions(blueprintConfiguration: Tv2BlueprintConfiguration): PartAction[] {
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
        this.videoMixerTimelineObjectFactory.createDveBoxesTimelineObject(boxes),
        this.videoMixerTimelineObjectFactory.createDvePropertiesTimelineObject(blueprintConfiguration, dveConfiguration.layoutProperties),
        this.videoMixerTimelineObjectFactory.createProgramTimelineObject(ATEM_SUPER_SOURCE_INDEX, timelineEnable),
        this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(ATEM_SUPER_SOURCE_INDEX, timelineEnable),
        this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(ATEM_SUPER_SOURCE_INDEX, timelineEnable),
        this.createCasparCgDveKeyTimelineObject(this.joinAssetToFolder(blueprintConfiguration.studio.DVEFolder, dveConfiguration.key)),
        this.createCasparCgDveFrameTimelineObject(this.joinAssetToFolder(blueprintConfiguration.studio.DVEFolder, dveConfiguration.frame)),
        this.createCasparCgDveLocatorTimelineObject()
      ]

      return {
        id: `dveLayoutAsNextAction_${dveConfiguration.name}`,
        name: dveConfiguration.name,
        description: '',
        type: PartActionType.INSERT_PART_AS_NEXT,
        data: {
          partInterface: this.createPartInterface(partId, dveConfiguration),
          pieceInterfaces: [this.createDvePieceInterface(partId, dveConfiguration.name, dveLayoutTimelineObjects)]
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

  private createDvePieceInterface(partId: string, name: string, timelineObjects: TimelineObject[]): PieceInterface {
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
}
