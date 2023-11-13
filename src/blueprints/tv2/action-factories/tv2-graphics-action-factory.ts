import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action } from '../../../model/entities/action'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import {
  Tv2DownstreamKeyer,
  Tv2DownstreamKeyerRole,
  Tv2GraphicsType
} from '../value-objects/tv2-studio-blueprint-configuration'
import { PartInterface } from '../../../model/entities/part'
import { AtemTransition, AtemTransitionSettings } from '../../timeline-state-resolver-types/atem-types'
import { GraphicsTemplate } from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2VizTimelineObjectFactory } from '../timeline-object-factories/tv2-viz-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2CasparCgTimelineObjectFactory } from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  Tv2GraphicsTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-graphics-timeline-object-factory'
import { Tv2ActionContentType, Tv2PartAction, Tv2PieceAction } from '../value-objects/tv2-action'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import {
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData
} from '../value-objects/tv2-action-manifest-data'
import { Tv2FileContent } from '../value-objects/tv2-content'
import { Tv2StringHashConverter } from '../helpers/tv2-string-hash-converter'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import { Tv2AssetPathHelper } from '../helpers/tv2-asset-path-helper'

const PILOT_PREFIX: string = 'PILOT_'

enum TemplateOutType {
  B = 'B',
  S = 'S',
  O = 'O',
}

export class Tv2GraphicsActionFactory {
  constructor(
    private readonly vizTimelineObjectFactory: Tv2VizTimelineObjectFactory,
    private readonly casparCgTimelineObjectFactory: Tv2CasparCgTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly assetPathHelper: Tv2AssetPathHelper,
    private readonly stringHashConverter: Tv2StringHashConverter
  ) { }

  public createGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData[], overlayGraphicsData: Tv2OverlayGraphicsManifestData[]): Action[] {
    return [
      this.createThemeOutAction(blueprintConfiguration),
      this.createOverlayInitializeAction(),
      this.createContinueGraphicsAction(),
      this.createClearGraphicsAction(blueprintConfiguration),
      this.createAllOutGraphicsAction(blueprintConfiguration),
      ...this.createFullscreenGraphicsActions(blueprintConfiguration, fullscreenGraphicsData),
      ...this.createIdentGraphicsActions(blueprintConfiguration, overlayGraphicsData),
      ...this.createLowerThirdActions(blueprintConfiguration, overlayGraphicsData)
    ]
  }

  private createAllOutGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'allOutGraphicsPiece',
      name: 'Gfx All Out',
      duration,
      timelineObjects: [
        this.vizTimelineObjectFactory.createAllOutGraphicsTimelineObject(blueprintConfiguration, duration)
      ]
    })
    return {
      id: 'allOutGraphicsAction',
      name: 'Gfx All Out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS,
      },
    }
  }

  private createClearGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'clearGraphicsPiece',
      name: 'Gfx Clear',
      duration,
      timelineObjects: [
        this.vizTimelineObjectFactory.createClearGraphicsTimelineObject(blueprintConfiguration, duration)
      ]
    })
    return {
      id: 'clearGraphicsAction',
      name: 'Gfx Clear',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS,
      },
    }
  }

  private createContinueGraphicsAction(): Tv2PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'continueGraphicsPiece',
      name: 'Gfx continue',
      duration,
      timelineObjects: [
        this.vizTimelineObjectFactory.createContinueGraphicsTimelineObject(duration)
      ]
    })
    return {
      id: 'continueGraphicsAction',
      name: 'Gfx continue',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS,
      },
    }
  }

  private createThemeOutAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'themeOutPiece',
      name: 'Theme Out',
      duration,
      timelineObjects: [
        this.vizTimelineObjectFactory.createThemeOutTimelineObject(
          blueprintConfiguration,
          duration
        )
      ]
    })
    return {
      id: 'themeOutAction',
      name: 'Theme out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS,
      },
    }
  }

  private createGraphicsPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>): Tv2PieceInterface {
    return {
      duration: 0,
      partId: '',
      layer: Tv2SourceLayer.GRAPHICS_ACTION_COMMAND,
      transitionType: TransitionType.NO_TRANSITION,
      pieceLifespan: PieceLifespan.WITHIN_PART,
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

  private createOverlayInitializeAction(): Tv2PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'overlayInitializePiece',
      name: 'Overlay Initialize',
      duration,
      timelineObjects: [
        this.vizTimelineObjectFactory.createOverlayInitializeTimelineObject(duration)
      ]
    })
    return {
      id: 'overlayInitializeAction',
      name: 'Overlay initialize',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS,
      },
    }
  }

  private createFullscreenGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData[]): Tv2PartAction[] {
    return fullscreenGraphicsData.map((data) => this.createFullscreenGraphicsActionFromBlueprintConfiguration(blueprintConfiguration, data))
  }

  private createFullscreenGraphicsActionFromBlueprintConfiguration(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): Tv2PartAction {
    switch (blueprintConfiguration.studio.GraphicsType) {
      case Tv2GraphicsType.HTML:
        return this.createCasparCgFullscreenGraphicsAction(blueprintConfiguration, fullscreenGraphicsData)
      case Tv2GraphicsType.VIZ:
      default:
        return this.createVizFullscreenGraphicsAction(blueprintConfiguration, fullscreenGraphicsData)
    }
  }

  private createVizFullscreenGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): Tv2PartAction {
    const partId: string = 'fullscreenGraphicsPart'
    const fullscreenGraphicPieceInterface: Tv2PieceInterface = this.createVizFullscreenGraphicsPieceInterface(partId, blueprintConfiguration, graphicsData)
    return this.createFullscreenGraphicsAction(
      blueprintConfiguration.studio.VizPilotGraphics.KeepAliveDuration,
      partId,
      fullscreenGraphicPieceInterface,
      graphicsData
    )
  }

  private createFullscreenGraphicsAction(
    keepPreviousPartAliveDuration: number,
    partId: string,
    pieceInterface: Tv2PieceInterface,
    fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData
  ): Tv2PartAction {
    const partInterface: PartInterface = this.createGraphicsPartInterface({
      id: partId,
      name: `Full ${fullscreenGraphicsData.name}`,
      inTransition: {
        keepPreviousPartAliveDuration,
        delayPiecesDuration: 0
      },
    })

    return {
      id: `fullscreen_graphics_${this.stringHashConverter.getHashedValue(fullscreenGraphicsData.name)}`,
      name: `Fullscreen Graphics - ${fullscreenGraphicsData.name}`,
      rundownId: fullscreenGraphicsData.rundownId,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [pieceInterface]
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS
      }
    }
  }

  private createVizFullscreenGraphicsPieceInterface(partId: string, blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): Tv2PieceInterface {
    return this.createGraphicsPieceInterface({
      id: 'fullscreenGraphicsPiece',
      partId,
      name: fullscreenGraphicsData.name,
      preRollDuration: blueprintConfiguration.studio.VizPilotGraphics.PrerollDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, fullscreenGraphicsData.name),
      layer: Tv2SourceLayer.PILOT_GRAPHICS,
      content: {
        fileName: `${PILOT_PREFIX}${fullscreenGraphicsData.vcpId}`,
        path: `${fullscreenGraphicsData.vcpId}`,
      },
      timelineObjects: this.createVizFullscreenPilotGraphicsTimelineObjects(blueprintConfiguration, fullscreenGraphicsData),
      metadata: {
        type: Tv2PieceType.GRAPHICS,
        outputLayer: Tv2OutputLayer.PROGRAM
      }
    })
  }

  private createGraphicsPartInterface(partInterfaceWithRequiredValues: Pick<PartInterface, 'id' | 'name'> & Partial<PartInterface>): PartInterface {
    return {
      disableNextInTransition: false,
      expectedDuration: 0,
      inTransition: {
        keepPreviousPartAliveDuration: 0,
        delayPiecesDuration: 0
      },
      isNext: false,
      isOnAir: false,
      isPlanned: false,
      outTransition: {
        keepAliveDuration: 0
      },
      pieces: [],
      rank: 0,
      segmentId: '',
      isUnsynced: false,
      ...partInterfaceWithRequiredValues
    }
  }

  private findPieceLifespan(blueprintConfiguration: Tv2BlueprintConfiguration, templateName: string): PieceLifespan {
    const template: GraphicsTemplate | undefined = blueprintConfiguration.showStyle.graphicsTemplates.find(
      graphic => graphic.vizTemplate ? graphic.vizTemplate.toUpperCase() === templateName.toUpperCase() : false
    )
    const templateOutType: TemplateOutType = this.parseTemplateOutType(template?.outType ?? '')
    return this.getPieceLifespanFromOutType(templateOutType)
  }

  private parseTemplateOutType(template: string): TemplateOutType {
    switch (template) {
      case 'S':
        return TemplateOutType.S
      case 'O':
        return TemplateOutType.O
      case 'B':
      default:
        return TemplateOutType.B
    }
  }

  private getPieceLifespanFromOutType(outType: TemplateOutType): PieceLifespan {
    switch (outType) {
      case TemplateOutType.B:
        return PieceLifespan.WITHIN_PART
      case TemplateOutType.S:
        return PieceLifespan.SPANNING_UNTIL_SEGMENT_END
      case TemplateOutType.O:
        return PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE
    }
  }

  private createVizFullscreenPilotGraphicsTimelineObjects(
    blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): TimelineObject[] {
    if (!blueprintConfiguration.studio.VizPilotGraphics.CleanFeedPrerollDuration) {
      throw new Tv2MisconfigurationException(
        'Missing configuration of \'VizPilotGraphics.CleanFeedPrerollDuration\' in settings.'
      )
    }
    const videoMixerEnable: TimelineEnable = { start: blueprintConfiguration.studio.VizPilotGraphics.CutToMediaPlayer }
    const sourceInput: number = blueprintConfiguration.studio.VizPilotGraphics.FullGraphicBackground
    const upstreamEnable: TimelineEnable = { start: blueprintConfiguration.studio.VizPilotGraphics.CleanFeedPrerollDuration }
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS)

    return [
      this.vizTimelineObjectFactory.createFullscreenGraphicsTimelineObject(blueprintConfiguration, fullscreenGraphicsData),
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(sourceInput, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(sourceInput, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(sourceInput, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, true),
      this.videoMixerTimelineObjectFactory.createUpstreamKeyerTimelineObject(
        downstreamKeyer,
        upstreamEnable
      ),
      this.audioTimelineObjectFactory.createStudioMicrophonesUpTimelineObject(blueprintConfiguration)
    ]
  }

  private createCasparCgFullscreenGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): Tv2PartAction {
    if (!blueprintConfiguration.studio.HTMLGraphics) {
      throw new Tv2MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. Make sure it exists, and contains a value for \'KeepAliveDuration\''
      )
    }

    const partId: string = 'fullscreenGraphicsPart'
    const fullscreenGraphicPiece: Tv2PieceInterface = this.createCasparCgFullscreenGraphicsPieceInterface(partId, blueprintConfiguration, graphicsData)
    return this.createFullscreenGraphicsAction(
      blueprintConfiguration.studio.HTMLGraphics.KeepAliveDuration,
      partId,
      fullscreenGraphicPiece,
      graphicsData
    )
  }

  private createCasparCgFullscreenGraphicsPieceInterface(partId: string, blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): Tv2PieceInterface {
    return this.createGraphicsPieceInterface({
      id: 'fullscreenGraphicsPiece',
      partId,
      name: fullscreenGraphicsData.name,
      preRollDuration: blueprintConfiguration.studio.CasparPrerollDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, fullscreenGraphicsData.name),
      layer: Tv2SourceLayer.PILOT_GRAPHICS,
      content: this.createCasparCgFullscreenGraphicsPieceContent(blueprintConfiguration, fullscreenGraphicsData),
      timelineObjects: this.createCasparCgFullscreenPilotGraphicsTimelineObjects(blueprintConfiguration, fullscreenGraphicsData),
      metadata: {
        type: Tv2PieceType.GRAPHICS,
        outputLayer: Tv2OutputLayer.PROGRAM
      }
    })
  }

  private createCasparCgFullscreenGraphicsPieceContent(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): Tv2FileContent {
    const graphicsFolder: string = blueprintConfiguration.studio.GraphicFolder ? `${blueprintConfiguration.studio.GraphicFolder}\\` : ''
    const nameChunks: string[] = graphicsData.name.split('/')
    const sceneName: string = nameChunks[nameChunks.length - 1]
    const filePath: string = this.assetPathHelper.joinAssetToFolder(sceneName, blueprintConfiguration.studio.GraphicFolder)

    return {
      fileName: filePath,
      path: this.assetPathHelper.joinAssetToNetworkPath(blueprintConfiguration.studio.GraphicNetworkBasePath, sceneName, blueprintConfiguration.studio.GraphicFileExtension, graphicsFolder),
      mediaFlowIds: [blueprintConfiguration.studio.GraphicMediaFlowId],
      ignoreMediaObjectStatus: blueprintConfiguration.studio.GraphicIgnoreStatus,
      ignoreBlackFrames: true,
      ignoreFreezeFrame: true,
    }
  }

  private createCasparCgFullscreenPilotGraphicsTimelineObjects(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData): TimelineObject[] {
    if (!blueprintConfiguration.studio.HTMLGraphics) {
      throw new Tv2MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. Make sure it exists, and contains a value for \'TransitionSettings.wipeRate\' and  \'TransitionSettings.borderSoftness\''
      )
    }

    const enable: TimelineEnable = { start: blueprintConfiguration.studio.CasparPrerollDuration }
    const sourceInput: number = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS).Fill
    const transition: AtemTransition = AtemTransition.WIPE
    const transitionSettings: AtemTransitionSettings = {
      wipe: {
        rate: blueprintConfiguration.studio.HTMLGraphics.TransitionSettings.wipeRate,
        pattern: 1,
        reverseDirection: true,
        borderSoftness: blueprintConfiguration.studio.HTMLGraphics.TransitionSettings.borderSoftness
      }
    }

    return [
      this.casparCgTimelineObjectFactory.createFullscreenGraphicsTimelineObject(blueprintConfiguration, fullscreenGraphicsData),
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(sourceInput, enable, transition, transitionSettings),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(sourceInput, enable, transition, transitionSettings),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(sourceInput, enable),
      this.audioTimelineObjectFactory.createStudioMicrophonesUpTimelineObject(blueprintConfiguration)
    ]
  }

  private getDownstreamKeyerMatchingRole(blueprintConfiguration: Tv2BlueprintConfiguration, role: Tv2DownstreamKeyerRole): Tv2DownstreamKeyer {
    return blueprintConfiguration.studio.SwitcherSource.DSK.find(
      downstreamKeyer => downstreamKeyer.Roles.some(
        keyerRole => keyerRole === role)
    ) ?? blueprintConfiguration.studio.SwitcherSource.DSK[0]
  }

  private createIdentGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData[]): Tv2PieceAction[] {
    const identData: Tv2OverlayGraphicsManifestData[] = graphicsData.filter(data => data.sourceLayerId === Tv2SourceLayer.IDENT)
    return identData.map(data => this.createIdentGraphicsAction(blueprintConfiguration, data))
  }

  private createIdentGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): Tv2PieceAction {
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.OVERLAY_GRAPHICS)
    const graphicsTimelineObjectFactory: Tv2GraphicsTimelineObjectFactory = blueprintConfiguration.studio.GraphicsType === Tv2GraphicsType.HTML
      ? this.casparCgTimelineObjectFactory
      : this.vizTimelineObjectFactory
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: '',
      name: overlayGraphicsData.name,
      layer: Tv2SourceLayer.IDENT,
      duration: overlayGraphicsData.expectedDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, overlayGraphicsData.templateName),
      timelineObjects: [
        graphicsTimelineObjectFactory.createIdentGraphicsTimelineObject(blueprintConfiguration, overlayGraphicsData),
        this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, true)
      ],
      metadata: {
        type: Tv2PieceType.OVERLAY_GRAPHICS,
        outputLayer: Tv2OutputLayer.OVERLAY
      }
    })
    return {
      id: `ident_${this.stringHashConverter.getHashedValue(overlayGraphicsData.name)}`,
      name: overlayGraphicsData.name,
      rundownId: overlayGraphicsData.rundownId,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS
      }
    }
  }

  private createLowerThirdActions(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData[]): Tv2PieceAction[] {
    const lowerThirdData: Tv2OverlayGraphicsManifestData[] = graphicsData.filter(data => data.sourceLayerId === Tv2SourceLayer.LOWER_THIRD)
    return lowerThirdData.map((data) => this.createLowerThirdGraphicsAction(blueprintConfiguration, data))
  }

  private createLowerThirdGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, overlayGraphicsData: Tv2OverlayGraphicsManifestData): Tv2PieceAction {
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.OVERLAY_GRAPHICS)
    const graphicsTimelineObjectFactory: Tv2GraphicsTimelineObjectFactory = blueprintConfiguration.studio.GraphicsType === Tv2GraphicsType.HTML
      ? this.casparCgTimelineObjectFactory
      : this.vizTimelineObjectFactory
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: '',
      name: overlayGraphicsData.name,
      layer: Tv2SourceLayer.LOWER_THIRD,
      duration: overlayGraphicsData.expectedDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, overlayGraphicsData.templateName),
      timelineObjects: [
        graphicsTimelineObjectFactory.createLowerThirdGraphicsTimelineObject(blueprintConfiguration, overlayGraphicsData),
        this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, true)
      ],
      metadata: {
        type: Tv2PieceType.OVERLAY_GRAPHICS,
        outputLayer: Tv2OutputLayer.OVERLAY
      }
    })

    return {
      id: `lower_third_${this.stringHashConverter.getHashedValue(overlayGraphicsData.name)}`,
      name: overlayGraphicsData.name,
      rundownId: overlayGraphicsData.rundownId,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS
      }
    }
  }
}
