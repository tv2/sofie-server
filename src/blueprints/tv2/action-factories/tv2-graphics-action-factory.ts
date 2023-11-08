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
import { Tv2CasparCgPathFixer } from '../helpers/tv2-caspar-cg-path-fixer'
import { MisconfigurationException } from '../../../model/exceptions/misconfiguration-exception'
import { TimelineEnable } from '../../../model/entities/timeline-enable'
import {
  Tv2GraphicsTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-graphics-timeline-object-factory'
import { createHash } from 'crypto'
import { Tv2ActionContentType, Tv2PartAction, Tv2PieceAction } from '../value-objects/tv2-action'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import {
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData
} from '../value-objects/tv2-action-manifest-data'
import { Tv2FileContent } from '../value-objects/tv2-content'

const GRAPHICS_PROGRAM_ID: string = 'graphicsProgram'
const GRAPHICS_CLEAN_FEED_ID: string = 'graphicsCleanFeed'
const GRAPHICS_LOOKAHEAD_ID: string = 'graphicsLookahead'

export class Tv2GraphicsActionFactory {
  constructor(
    private readonly vizGraphicsTimelineObjectFactory: Tv2VizTimelineObjectFactory,
    private readonly casparCgGraphicsTimelineObjectFactory: Tv2CasparCgTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly casparCgPathFixer: Tv2CasparCgPathFixer
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
        this.vizGraphicsTimelineObjectFactory.createAllOutGraphicsTimelineObject(blueprintConfiguration, duration)
      ]
    })
    return {
      id: 'allOutGraphicsAction',
      name: 'Gfx All Out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface,
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
        this.vizGraphicsTimelineObjectFactory.createClearGraphicsTimelineObject(blueprintConfiguration, duration)
      ]
    })
    return {
      id: 'clearGraphicsAction',
      name: 'Gfx Clear',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface,
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
        this.vizGraphicsTimelineObjectFactory.createContinueGraphicsTimelineObject(duration)
      ]
    })
    return {
      id: 'continueGraphicsAction',
      name: 'Gfx continue',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface,
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
        this.vizGraphicsTimelineObjectFactory.createThemeOutTimelineObject(
          blueprintConfiguration,
          duration
        )
      ]
    })
    return {
      id: 'themeOutAction',
      name: 'Theme out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface,
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
        this.vizGraphicsTimelineObjectFactory.createOverlayInitializeTimelineObject(duration)
      ]
    })
    return {
      id: 'overlayInitializeAction',
      name: 'Overlay initialize',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface,
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS,
      },
    }
  }

  private createFullscreenGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, fullscreenGraphicsData: Tv2FullscreenGraphicsManifestData[]): Tv2PartAction[] {
    let chosenMethod: (blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData) => Tv2PartAction
    switch (blueprintConfiguration.studio.GraphicsType) {
      case Tv2GraphicsType.HTML: {
        chosenMethod = this.createCasparCgFullGraphicsActionFromGraphicsData.bind(this)
        break
      }
      case Tv2GraphicsType.VIZ:
      default: {
        chosenMethod = this.createVizFullGraphicsActionFromGraphicsData.bind(this)
        break
      }
    }

    return fullscreenGraphicsData.map((data) => chosenMethod(
      blueprintConfiguration,
      data
    ))
  }

  private createVizFullGraphicsActionFromGraphicsData(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): Tv2PartAction {
    const partId: string = 'fullGraphicsPart'
    const fullGraphicPiece: Tv2PieceInterface = this.createVizFullGraphicsPiece(blueprintConfiguration, graphicsData, partId)
    return this.createFullGraphicsActionFromGraphicsData(
      blueprintConfiguration.studio.VizPilotGraphics.KeepAliveDuration,
      partId,
      fullGraphicPiece,
      graphicsData
    )
  }

  private createFullGraphicsActionFromGraphicsData(
    keepPreviousPartAliveDuration: number,
    partId: string,
    pieceInterface: Tv2PieceInterface,
    graphicsData: Tv2FullscreenGraphicsManifestData
  ): Tv2PartAction {
    const partInterface: PartInterface = this.createGraphicsPartInterface({
      id: partId,
      name: `Full ${graphicsData.name}`,
      inTransition: {
        keepPreviousPartAliveDuration,
        delayPiecesDuration: 0
      },
    })

    return {
      id: `full_graphics_${this.getHashedValue(graphicsData.name)}`,
      name: `Full Graphics - ${graphicsData.name}`,
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

  // Todo: Figure out if it should be moved to a base class for all action factories
  private getHashedValue(valueToBeHashed: string ): string {
    return createHash('md5').update(valueToBeHashed).digest('hex')
  }

  private createVizFullGraphicsPiece(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData, partId: string): Tv2PieceInterface {
    return this.createGraphicsPieceInterface({
      id: 'fullGraphicPiece',
      partId,
      name: graphicsData.name,
      preRollDuration: blueprintConfiguration.studio.VizPilotGraphics.PrerollDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, graphicsData.name),
      layer: Tv2SourceLayer.PILOT_GRAPHICS,
      content: {
        fileName: `PILOT_${graphicsData.vcpId}`,
        path: `${graphicsData.vcpId}`,
      },
      timelineObjects: [
        this.vizGraphicsTimelineObjectFactory.createFullGraphicsTimelineObject(blueprintConfiguration, graphicsData),
        ...this.createVizFullPilotTimelineObjects(blueprintConfiguration),
      ]
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
      isNext: true,
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

    if (
      !template ||
      (!template.outType || !template.outType.toString().length) ||
      (template.outType !== 'B' && template.outType !== 'S' && template.outType !== 'O')
    ) {
      return PieceLifespan.WITHIN_PART
    }

    return this.getPieceLifeSpanFromMode(template.outType)
  }

  private getPieceLifeSpanFromMode(mode: 'B' | 'S' | 'O'): PieceLifespan {
    switch (mode) {
      case 'B':
        return PieceLifespan.WITHIN_PART
      case 'S':
        return PieceLifespan.SPANNING_UNTIL_SEGMENT_END
      case 'O':
        return PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE
    }
  }

  private createVizFullPilotTimelineObjects(
    blueprintConfiguration: Tv2BlueprintConfiguration
  ): TimelineObject[] {
    if (!blueprintConfiguration.studio.VizPilotGraphics.CleanFeedPrerollDuration) {
      throw new MisconfigurationException(
        'Missing configuration of \'VizPilotGraphics.CleanFeedPrerollDuration\' in settings.'
      )
    }
    const enable: TimelineEnable = { start: blueprintConfiguration.studio.VizPilotGraphics.CutToMediaPlayer }
    const sourceInput: number = blueprintConfiguration.studio.VizPilotGraphics.FullGraphicBackground
    const upstreamEnable: TimelineEnable = { start: blueprintConfiguration.studio.VizPilotGraphics.CleanFeedPrerollDuration }
    const downstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS)
    const downstreamKeyerEnable: TimelineEnable = { start: 0 }
    const priority: number = 0

    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(GRAPHICS_PROGRAM_ID, sourceInput, enable),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(GRAPHICS_CLEAN_FEED_ID, sourceInput, enable),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(GRAPHICS_LOOKAHEAD_ID, sourceInput, enable),
      this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(
        downstreamKeyer,
        true,
        downstreamKeyerEnable,
        priority
      ),
      this.videoMixerTimelineObjectFactory.createUpstreamKeyerTimelineObject(
        downstreamKeyer,
        upstreamEnable
      ),
      this.audioTimelineObjectFactory.createStudioMicrophonesUpTimelineObject(blueprintConfiguration)
    ]
  }

  private createCasparCgFullGraphicsActionFromGraphicsData(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): Tv2PartAction {
    if (!blueprintConfiguration.studio.HTMLGraphics) {
      throw new MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. ' +
        'Make sure it exists, and contains a value for \'KeepAliveDuration\''
      )
    }

    const partId: string = 'fullGraphicsPart'
    const fullGraphicPiece: Tv2PieceInterface = this.createCasparCgFullGraphicsPiece(blueprintConfiguration, graphicsData, partId)
    return this.createFullGraphicsActionFromGraphicsData(
      blueprintConfiguration.studio.HTMLGraphics.KeepAliveDuration,
      partId,
      fullGraphicPiece,
      graphicsData
    )
  }

  private createCasparCgFullGraphicsPiece(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData, partId: string): Tv2PieceInterface {
    return this.createGraphicsPieceInterface({
      id: 'fullGraphicPiece',
      partId,
      name: graphicsData.name,
      preRollDuration: blueprintConfiguration.studio.CasparPrerollDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, graphicsData.name),
      layer: Tv2SourceLayer.PILOT_GRAPHICS,
      content: this.createCasparCgFullGraphicsPieceContent(blueprintConfiguration, graphicsData),
      timelineObjects: [
        this.casparCgGraphicsTimelineObjectFactory.createFullGraphicsTimelineObject(blueprintConfiguration, graphicsData),
        ...this.createCasparCgFullPilotGraphicsTimelineObjects(blueprintConfiguration)
      ]
    })
  }

  private createCasparCgFullGraphicsPieceContent(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): Tv2FileContent {
    const rawGraphicsFolder: string | undefined = blueprintConfiguration.studio.GraphicFolder
    const graphicsFolder: string = rawGraphicsFolder ? `${rawGraphicsFolder}\\` : ''
    const sceneChunks: string[] = graphicsData.name.split('/')
    const sceneName: string = sceneChunks[sceneChunks.length - 1]
    const fileName: string = this.casparCgPathFixer.joinAssetToFolder(sceneName, rawGraphicsFolder)

    return {
      fileName,
      path: this.casparCgPathFixer.joinAssetToNetworkPath(blueprintConfiguration.studio.GraphicNetworkBasePath, sceneName, blueprintConfiguration.studio.GraphicFileExtension, graphicsFolder),
      mediaFlowIds: [blueprintConfiguration.studio.GraphicMediaFlowId],
      ignoreMediaObjectStatus: blueprintConfiguration.studio.GraphicIgnoreStatus,
      ignoreBlackFrames: true,
      ignoreFreezeFrame: true,
    }
  }

  private createCasparCgFullPilotGraphicsTimelineObjects(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject[] {
    if (!blueprintConfiguration.studio.HTMLGraphics) {
      throw new MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. ' +
        'Make sure it exists, and contains a value for \'TransitionSettings.wipeRate\' and  \'TransitionSettings.borderSoftness\''
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
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(GRAPHICS_PROGRAM_ID, sourceInput, enable, transition, transitionSettings),
      this.videoMixerTimelineObjectFactory.createCleanFeedTimelineObject(GRAPHICS_CLEAN_FEED_ID, sourceInput, enable, transition, transitionSettings),
      this.videoMixerTimelineObjectFactory.createLookaheadTimelineObject(GRAPHICS_LOOKAHEAD_ID, sourceInput, enable),
      this.audioTimelineObjectFactory.createStudioMicrophonesUpTimelineObject(blueprintConfiguration)
    ]
  }

  private getDownstreamKeyerMatchingRole(blueprintConfiguration: Tv2BlueprintConfiguration, role: Tv2DownstreamKeyerRole): Tv2DownstreamKeyer {
    return blueprintConfiguration.studio.SwitcherSource.DSK.find(
      downstreamKeyer => downstreamKeyer.Roles.some(
        keyerRole => keyerRole === role)) ?? blueprintConfiguration.studio.SwitcherSource.DSK[0]
  }

  private createIdentGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData[]): Tv2PieceAction[] {
    const identData: Tv2OverlayGraphicsManifestData[] = graphicsData.filter(data => data.sourceLayerId === Tv2SourceLayer.IDENT)
    return identData.map(data => this.createIdentGraphicsAction(
      blueprintConfiguration,
      data)
    )
  }

  private createIdentGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData): Tv2PieceAction {
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.OVERLAY_GRAPHICS)
    const chosenTimelineObjectFactory: Tv2GraphicsTimelineObjectFactory = blueprintConfiguration.studio.GraphicsType === Tv2GraphicsType.HTML
      ? this.casparCgGraphicsTimelineObjectFactory
      : this.vizGraphicsTimelineObjectFactory
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: '',
      name: graphicsData.name,
      layer: Tv2SourceLayer.IDENT,
      duration: graphicsData.expectedDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, this.getTemplateName(graphicsData)),
      timelineObjects: [
        chosenTimelineObjectFactory.createIdentGraphicsTimelineObject(blueprintConfiguration, graphicsData),
        this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, true, { start: 0 }, 1)
      ]
    })
    return {
      id: `ident_${this.getHashedValue(graphicsData.name)}`,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      name: graphicsData.name,
      data: pieceInterface,
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS
      }
    }
  }

  // Todo: merge with copy in 'Tv2BaseGraphicTimelineObjectFactory'
  /**
   * @remarks
   * For use with Graphics data generated from AdLibPieces.
   */
  protected getTemplateName(overlayGraphicsData: Tv2OverlayGraphicsManifestData): string {
    return overlayGraphicsData.name.split('-')[0].trim()
  }

  private createLowerThirdActions(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData[]): Tv2PieceAction[] {
    const lowerThirdData: Tv2OverlayGraphicsManifestData[] = graphicsData.filter(data => data.sourceLayerId === Tv2SourceLayer.LOWER_THIRD)
    return lowerThirdData.map((data) => this.createLowerThirdGraphicsAction(
      blueprintConfiguration,
      data
    ))
  }

  private createLowerThirdGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData): Tv2PieceAction {
    const downstreamKeyer: Tv2DownstreamKeyer = this.getDownstreamKeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.OVERLAY_GRAPHICS)
    const chosenTimelineObjectFactory: Tv2GraphicsTimelineObjectFactory = blueprintConfiguration.studio.GraphicsType === Tv2GraphicsType.HTML
      ? this.casparCgGraphicsTimelineObjectFactory
      : this.vizGraphicsTimelineObjectFactory
    const pieceInterface: Tv2PieceInterface = this.createGraphicsPieceInterface({
      id: '',
      name: graphicsData.name,
      layer: Tv2SourceLayer.LOWER_THIRD,
      duration: graphicsData.expectedDuration,
      pieceLifespan: this.findPieceLifespan(blueprintConfiguration, this.getTemplateName(graphicsData)),
      timelineObjects: [
        chosenTimelineObjectFactory.createLowerThirdGraphicsTimelineObject(blueprintConfiguration, graphicsData),
        this.videoMixerTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, true, { start: 0 }, 1)
      ]
    })

    return {
      id: `lower_third_${this.getHashedValue(graphicsData.name)}`,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      name: graphicsData.name,
      data: pieceInterface,
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS
      }
    }
  }


}
