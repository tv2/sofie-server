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
import { GraphicsTemplate } from '../value-objects/tv2-show-style-blueprint-configuration'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory,
  VideoMixerWipeTransitionSettings
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  Tv2GraphicsElementTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-graphics-element-timeline-object-factory'
import { Tv2ActionContentType, Tv2PartAction, Tv2PieceAction } from '../value-objects/tv2-action'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import {
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData
} from '../value-objects/tv2-action-manifest-data'
import { Tv2StringHashConverter } from '../helpers/tv2-string-hash-converter'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import {
  Tv2GraphicsCommandTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-graphics-command-timeline-object-factory'
import {
  Tv2GraphicsTimelineObjectFactoryFactory
} from '../timeline-object-factories/tv2-graphics-timeline-object-factory-factory'
import { Tv2ActionManifestMapper } from '../helpers/tv2-action-manifest-mapper'
import { Tv2ActionManifest } from '../value-objects/tv2-action-manifest'

export class Tv2GraphicsActionFactory {

  constructor(
    private readonly actionManifestMapper: Tv2ActionManifestMapper,
    private readonly graphicsTimelineObjectFactoryFactory: Tv2GraphicsTimelineObjectFactoryFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly stringHashConverter: Tv2StringHashConverter
  ) { }

  public createGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2ActionManifest[]): Action[] {
    const commandTimelineObjectFactory: Tv2GraphicsCommandTimelineObjectFactory = this.graphicsTimelineObjectFactoryFactory.createGraphicsCommandTimelineObjectFactory(blueprintConfiguration)
    const elementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory = this.graphicsTimelineObjectFactoryFactory.createGraphicsElementTimelineObjectFactory(blueprintConfiguration)

    const fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData[] = this.actionManifestMapper.mapToFullscreenGraphicsManifestData(actionManifests)
    const overlayGraphicsData: Tv2OverlayGraphicsManifestData[] = this.actionManifestMapper.mapToOverlayGraphicsData(actionManifests)


    return [
      this.createThemeOutAction(blueprintConfiguration, commandTimelineObjectFactory),
      this.createOverlayInitializeAction(commandTimelineObjectFactory),
      this.createContinueGraphicsAction(commandTimelineObjectFactory),
      this.createClearGraphicsAction(blueprintConfiguration, commandTimelineObjectFactory),
      this.createAllOutGraphicsAction(blueprintConfiguration, commandTimelineObjectFactory),
      ...this.createFullscreenGraphicsActions(blueprintConfiguration, elementTimelineObjectFactory, fullscreenGraphicsData),
      ...this.createIdentGraphicsActions(blueprintConfiguration, elementTimelineObjectFactory, overlayGraphicsData),
      ...this.createLowerThirdActions(blueprintConfiguration, elementTimelineObjectFactory, overlayGraphicsData)
    ]
  }

  private createThemeOutAction(blueprintConfiguration: Tv2BlueprintConfiguration, commandTimelineObjectFactory: Tv2GraphicsCommandTimelineObjectFactory): Tv2PieceAction {
    const duration: number = 3000
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'themeOutPiece',
      name: 'Theme Out',
      duration,
      timelineObjects: [
        commandTimelineObjectFactory.createThemeOutTimelineObject(blueprintConfiguration)
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
      partId: '',
      layer: Tv2SourceLayer.GRAPHICS_ACTION_COMMAND,
      transitionType: TransitionType.NO_TRANSITION,
      pieceLifespan: PieceLifespan.WITHIN_PART,
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

  private createOverlayInitializeAction(commandTimelineObjectFactory: Tv2GraphicsCommandTimelineObjectFactory): Tv2PieceAction {
    const duration: number = 1000
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'overlayInitializePiece',
      name: 'Overlay Initialize',
      duration,
      timelineObjects: [commandTimelineObjectFactory.createOverlayInitializeTimelineObject()]
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

  private createContinueGraphicsAction(commandTimelineObjectFactory: Tv2GraphicsCommandTimelineObjectFactory): Tv2PieceAction {
    const duration: number = 1000
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'continueGraphicsPiece',
      name: 'Gfx continue',
      duration,
      timelineObjects: [commandTimelineObjectFactory.createContinueGraphicsTimelineObject()]
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

  private createClearGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, commandTimelineObjectFactory: Tv2GraphicsCommandTimelineObjectFactory): Tv2PieceAction {
    const duration: number = 3000
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'clearGraphicsPiece',
      name: 'Gfx Clear',
      duration,
      timelineObjects: [commandTimelineObjectFactory.createClearGraphicsTimelineObject(blueprintConfiguration)]
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

  private createAllOutGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, commandTimelineObjectFactory: Tv2GraphicsCommandTimelineObjectFactory): Tv2PieceAction {
    const duration: number = 3000
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: 'allOutGraphicsPiece',
      name: 'Gfx All Out',
      duration,
      timelineObjects: [commandTimelineObjectFactory.createAllOutGraphicsTimelineObject(blueprintConfiguration)]
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

  private createFullscreenGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, elementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData[]): Tv2PartAction[] {
    return fullscreenGraphicsData.map((graphicsData) => {
      const partInterface: PartInterface = this.createFullscreenGraphicsPartInterface(graphicsData, blueprintConfiguration)
      const pieceInterface: Tv2PieceInterface = this.createFullscreenGraphicsPieceInterface(blueprintConfiguration, graphicsData, partInterface, elementTimelineObjectFactory)

      return {
        id: `fullscreen_graphics_${this.stringHashConverter.getHashedValue(graphicsData.name)}`,
        rundownId: graphicsData.rundownId,
        name: `Fullscreen Graphics - ${graphicsData.name}`,
        type: PartActionType.INSERT_PART_AS_NEXT,
        data: {
          partInterface: partInterface,
          pieceInterfaces: [pieceInterface]
        },
        metadata: {
          contentType: Tv2ActionContentType.GRAPHICS
        }
      }
    })
  }

  private createFullscreenGraphicsPartInterface(graphicsData: Tv2FullscreenGraphicsManifestData, blueprintConfiguration: Tv2BlueprintConfiguration): PartInterface {
    return {
      id: `fullscreenGraphicsPart_${graphicsData.name}`,
      name: `Full ${graphicsData.name}`,
      segmentId: '',
      inTransition: {
        keepPreviousPartAliveDuration: this.getKeepOldPartAliveDuration(blueprintConfiguration),
        delayPiecesDuration: 0
      },
      outTransition: {
        keepAliveDuration: 0
      },
      isNext: false,
      isOnAir: false,
      isPlanned: false,
      pieces: [],
      rank: 0,
      isUnsynced: false,
      disableNextInTransition: false,
      expectedDuration: 0,
    }
  }

  private createFullscreenGraphicsPieceInterface(
    blueprintConfiguration: Tv2BlueprintConfiguration,
    graphicsData: Tv2FullscreenGraphicsManifestData,
    partInterface: PartInterface,
    elementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory
  ): Tv2PieceInterface {
    const videoMixerTimelineObjects: TimelineObject[] = this.isUsingHtmlGraphics(blueprintConfiguration)
      ? this.createVideoMixerTimelineObjectsForHtmlFullscreenGraphics(blueprintConfiguration)
      : this.createVideoMixerTimelineObjectsForVizFullscreenGraphics(blueprintConfiguration)

    return this.createGraphicsPieceInterface({
      id: `fullscreenGraphicsPiece_${graphicsData.name}`,
      partId: partInterface.id,
      name: graphicsData.name,
      preRollDuration: this.getPreRollDuration(blueprintConfiguration),
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, graphicsData.name),
      layer: Tv2SourceLayer.PILOT_GRAPHICS,
      timelineObjects: [
        elementTimelineObjectFactory.createFullscreenGraphicsTimelineObject(blueprintConfiguration, graphicsData),
        this.audioTimelineObjectFactory.createStudioMicrophonesUpTimelineObject(blueprintConfiguration),
        ...videoMixerTimelineObjects
      ],
      metadata: {
        type: Tv2PieceType.GRAPHICS,
        outputLayer: Tv2OutputLayer.PROGRAM
      }
    })
  }

  private isUsingHtmlGraphics(blueprintConfiguration: Tv2BlueprintConfiguration): boolean {
    return blueprintConfiguration.studio.selectedGraphicsType === Tv2GraphicsType.HTML
  }

  private getPreRollDuration(blueprintConfiguration: Tv2BlueprintConfiguration): number {
    return this.isUsingHtmlGraphics(blueprintConfiguration)
      ? blueprintConfiguration.studio.casparCgPreRollDuration
      : blueprintConfiguration.studio.vizPilotGraphics.msPreRollBeforeTakingPilotGraphics
  }

  private getKeepOldPartAliveDuration(blueprintConfiguration: Tv2BlueprintConfiguration): number {
    return this.isUsingHtmlGraphics(blueprintConfiguration)
      ? blueprintConfiguration.studio.htmlGraphics?.msKeepOldPartAliveBeforeTakingGraphics ?? 0
      : blueprintConfiguration.studio.vizPilotGraphics.msKeepOldPartAliveBeforeTakingGraphics
  }

  private createVideoMixerTimelineObjectsForHtmlFullscreenGraphics(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject[] {
    if (!blueprintConfiguration.studio.htmlGraphics) {
      throw new Tv2MisconfigurationException(
        'Missing configuration of \'HtmlGraphics\' in settings. Make sure it exists, and contains a value for \'TransitionSettings.wipeRate\' and  \'TransitionSettings.borderSoftness\''
      )
    }

    const enable: TimelineEnable = { start: blueprintConfiguration.studio.casparCgPreRollDuration }
    const sourceInput: number = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS).videoMixerFillSource
    const transitionSettings: VideoMixerWipeTransitionSettings = {
      frameRate: blueprintConfiguration.studio.htmlGraphics.transitionSettings.wipeRate,
      borderSoftness: blueprintConfiguration.studio.htmlGraphics.transitionSettings.borderSoftness
    }

    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObjectWithWipeTransition(sourceInput, enable, transitionSettings),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObjectWithWipeTransition(sourceInput, enable, transitionSettings),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(sourceInput, enable),
    ]
  }

  private createVideoMixerTimelineObjectsForVizFullscreenGraphics(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject[] {
    if (!blueprintConfiguration.studio.vizPilotGraphics.msBeforeShowingBeforeShowingOnCleanFeed) {
      throw new Tv2MisconfigurationException(
        'Missing configuration of \'VizPilotGraphics.msBeforeShowingBeforeShowingOnCleanFeed\' in settings.'
      )
    }

    const videoMixerEnable: TimelineEnable = { start: blueprintConfiguration.studio.vizPilotGraphics.msFromStartBeforeCuttingToBackgroundSource }
    const sourceInput: number = blueprintConfiguration.studio.vizPilotGraphics.backgroundVideoSwitcherSource
    const upstreamEnable: TimelineEnable = { start: blueprintConfiguration.studio.vizPilotGraphics.msBeforeShowingBeforeShowingOnCleanFeed }
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS)

    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(sourceInput, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(sourceInput, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(sourceInput, videoMixerEnable),
      this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, true),
      this.videoMixerTimelineObjectFactory.createUpstreamKeyerTimelineObject(
        downstreamKeyer,
        upstreamEnable
      ),
    ]
  }

  private findPieceLifespan(blueprintConfiguration: Tv2BlueprintConfiguration, templateName: string): PieceLifespan {
    const template: GraphicsTemplate | undefined = blueprintConfiguration.showStyle.graphicsTemplates.find(
      graphic => graphic.name ? graphic.name.toUpperCase() === templateName.toUpperCase() : false
    )
    return template?.lifespan ?? PieceLifespan.WITHIN_PART
  }

  private getDownstreamKeyerMatchingRole(blueprintConfiguration: Tv2BlueprintConfiguration, role: Tv2DownstreamKeyerRole): Tv2DownstreamKeyer {
    return blueprintConfiguration.studio.videoMixerBasicConfiguration.downstreamKeyers.find(
      downstreamKeyer => downstreamKeyer.roles.some(keyerRole => keyerRole === role)
    ) ?? blueprintConfiguration.studio.videoMixerBasicConfiguration.downstreamKeyers[0]
  }

  private createIdentGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, elementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory, graphicsData: Tv2OverlayGraphicsManifestData[]): Tv2PieceAction[] {
    const identData: Tv2OverlayGraphicsManifestData[] = graphicsData.filter(data => data.sourceLayerId === Tv2SourceLayer.IDENT)
    return identData.map(data => this.createIdentGraphicsAction(blueprintConfiguration, elementTimelineObjectFactory, data))
  }

  private createIdentGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, elementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory, overlayGraphicsData: Tv2OverlayGraphicsManifestData): Tv2PieceAction {
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.OVERLAY_GRAPHICS)
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: '',
      name: overlayGraphicsData.name,
      layer: Tv2SourceLayer.IDENT,
      duration: overlayGraphicsData.expectedDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, overlayGraphicsData.templateName),
      timelineObjects: [
        elementTimelineObjectFactory.createIdentGraphicsTimelineObject(blueprintConfiguration, overlayGraphicsData),
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

  private createLowerThirdActions(blueprintConfiguration: Tv2BlueprintConfiguration, elementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory, graphicsData: Tv2OverlayGraphicsManifestData[]): Tv2PieceAction[] {
    const lowerThirdData: Tv2OverlayGraphicsManifestData[] = graphicsData.filter(data => data.sourceLayerId === Tv2SourceLayer.LOWER_THIRD)
    return lowerThirdData.map((data) => this.createLowerThirdGraphicsAction(blueprintConfiguration, elementTimelineObjectFactory, data))
  }

  private createLowerThirdGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, elementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory, overlayGraphicsData: Tv2OverlayGraphicsManifestData): Tv2PieceAction {
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.OVERLAY_GRAPHICS)
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: '',
      name: overlayGraphicsData.name,
      layer: Tv2SourceLayer.LOWER_THIRD,
      duration: overlayGraphicsData.expectedDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, overlayGraphicsData.templateName),
      timelineObjects: [
        elementTimelineObjectFactory.createLowerThirdGraphicsTimelineObject(blueprintConfiguration, overlayGraphicsData),
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
