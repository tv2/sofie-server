import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Tv2GraphicsActionManifest } from '../value-objects/tv2-action-manifest'
import {
  Tv2DownstreamKeyer,
  Tv2DownstreamKeyerRole,
  Tv2GraphicsType
} from '../value-objects/tv2-studio-blueprint-configuration'
import { PartInterface } from '../../../model/entities/part'
import { Tv2GraphicsTarget } from '../value-objects/tv2-graphics-target'
import { Tv2TimelineObjectGraphicsContent } from '../value-objects/tv2-content'
import { AtemTransition, AtemTransitionSettings } from '../../timeline-state-resolver-types/atem-types'
import { GraphicsTemplate } from '../value-objects/tv2-show-style-blueprint-configuration'
import {
  Tv2VizGraphicsTimelineObjectFactory
} from '../timeline-object-factories/tv2-viz-graphics-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2ActionContentType, Tv2PartAction, Tv2PieceAction } from '../value-objects/tv2-action'
import {
  Tv2CasparCgGraphicsTimelineObjectFactory
} from '../timeline-object-factories/tv2-caspar-cg-graphics-timeline-object-factory'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Tv2CasparCgPathFixer } from '../helpers/tv2-caspar-cg-path-fixer'
import { MisconfigurationException } from '../../../model/exceptions/misconfiguration-exception'

export class Tv2GraphicsActionFactory {
  constructor(
    private readonly vizGraphicsTimelineObjectFactory: Tv2VizGraphicsTimelineObjectFactory,
    private readonly casparCgGraphicsTimelineObjectFactory: Tv2CasparCgGraphicsTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory,
    private readonly casparCgPathFixer: Tv2CasparCgPathFixer
  ) { }

  public createGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2GraphicsActionManifest[]): Action[] {
    return [
      this.createThemeOutAction(blueprintConfiguration),
      this.createOverlayInitializeAction(),
      this.createContinueGraphicsAction(),
      this.createClearGraphicsAction(blueprintConfiguration),
      this.createAllOutGraphicsAction(blueprintConfiguration),
      ...this.createFullscreenGraphicActionsFromActionManifests(blueprintConfiguration, actionManifests)
    ]
  }

  private createAllOutGraphicsAction(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = this.createGraphicsPieceInterface({
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
    const pieceInterface: PieceInterface = this.createGraphicsPieceInterface({
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
    const pieceInterface: PieceInterface = this.createGraphicsPieceInterface({
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
    const pieceInterface: PieceInterface = this.createGraphicsPieceInterface({
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

  private createGraphicsPieceInterface(pieceInterfaceWithRequiredValues: Pick<PieceInterface, 'id' | 'name'> & Partial<PieceInterface>): PieceInterface {
    return {
      duration: 0,
      partId: '',
      type: PieceType.GRAPHIC,
      layer: Tv2SourceLayer.GRAPHICS_ACTION_COMMAND,
      transitionType: TransitionType.NO_TRANSITION,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      isPlanned: false,
      start: 0,
      preRollDuration: 0,
      postRollDuration: 0,
      tags: [],
      timelineObjects: [],
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createOverlayInitializeAction(): Tv2PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: PieceInterface = this.createGraphicsPieceInterface({
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

  private createFullscreenGraphicActionsFromActionManifests(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2GraphicsActionManifest[]): Tv2PartAction[] {
    switch (blueprintConfiguration.studio.GraphicsType) {
      case Tv2GraphicsType.HTML: return this.createCasparCgFullscreen(blueprintConfiguration, actionManifests)
      case Tv2GraphicsType.VIZ:
      default: return this.createVizFullscreen(blueprintConfiguration, actionManifests)
    }
  }

  private createVizFullscreen(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2GraphicsActionManifest[]): Tv2PartAction[] {
    return actionManifests.map((manifest) => this.createVizGraphicsActionFromManifest(
      blueprintConfiguration,
      manifest
    ))
  }



  private createVizGraphicsActionFromManifest(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest): Tv2PartAction {
    const target: Tv2GraphicsTarget = Tv2GraphicsTarget.FULL
    const partId: string = `${this.getGraphicTargetAsCamelString(target)}Part`
    const fullGraphicPiece: PieceInterface = this.createVizFullGraphicsPiece(blueprintConfiguration, manifest, partId)
    const partInterface: PartInterface = this.createGraphicsPartInterface({
      id: partId,
      name: `${this.getGraphicTargetAsCamelString(target)} ${manifest.userData.name}`,
      inTransition: {
        keepPreviousPartAliveDuration: blueprintConfiguration.studio.VizPilotGraphics.KeepAliveDuration,
        delayPiecesDuration: 0
      },
    })

    return {
      id: `manifestAction_${manifest.userData.name.replaceAll('/', '')}`,
      name: `Manifest Action - ${manifest.userData.name}`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [ fullGraphicPiece ]
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS
      }
    }
  }

  private createVizFullGraphicsPiece(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest, partId: string): PieceInterface {
    return this.createGraphicsPieceInterface({
      id: 'fullGraphicPiece',
      partId,
      name: manifest.userData.name,
      preRollDuration: blueprintConfiguration.studio.VizPilotGraphics.PrerollDuration,
      pieceLifespan: this.findInfiniteModeFromConfig(blueprintConfiguration, manifest),
      layer: Tv2SourceLayer.PILOT_GRAPHICS,
      content: this.createVizFullGraphicsPieceContent(blueprintConfiguration, manifest)
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
      ...partInterfaceWithRequiredValues
    }
  }

  private getGraphicTargetAsCamelString(target: Tv2GraphicsTarget): string {
    return target.toString()
      .split('_')
      .map(fragment => fragment.charAt(0).toUpperCase() + fragment.substring(1).toLowerCase())
      .join('_')
  }

  private findInfiniteModeFromConfig(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest): PieceLifespan {
    const template: GraphicsTemplate | undefined = blueprintConfiguration.showStyle.GfxTemplates.find(
      graphic => graphic.VizTemplate ? graphic.VizTemplate.toUpperCase() === manifest.userData.name : false
    )

    if (
      !template ||
      (!template.OutType || !template.OutType.toString().length) ||
      (template.OutType !== 'B' && template.OutType !== 'S' && template.OutType !== 'O')
    ) {
      return PieceLifespan.WITHIN_PART
    }

    return this.getPieceLifeSpanFromMode(template.OutType)
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

  private createVizFullGraphicsPieceContent(
    blueprintConfiguration: Tv2BlueprintConfiguration,
    manifest: Tv2GraphicsActionManifest
  ): Tv2TimelineObjectGraphicsContent {
    return {
      fileName: `PILOT_${manifest.userData.vcpid}`,
      path: manifest.userData.vcpid.toString(),
      timelineObjects: [
        this.vizGraphicsTimelineObjectFactory.createFullGraphicsTimelineObject(blueprintConfiguration, manifest),
        ...this.createVizFullPilotTimelineObjects(blueprintConfiguration),
      ]
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

    const start: number = blueprintConfiguration.studio.VizPilotGraphics.CutToMediaPlayer
    const input: number = blueprintConfiguration.studio.VizPilotGraphics.FullGraphicBackground
    const transition: AtemTransition = AtemTransition.CUT
    const upstreamStart: number = blueprintConfiguration.studio.VizPilotGraphics.CleanFeedPrerollDuration

    return [
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(start, input, transition),
      this.videoMixerTimelineObjectFactory.createCleanTimelineObject(start, input, transition),
      this.videoMixerTimelineObjectFactory.createNextAuxTimelineObject(input),
      this.videoMixerTimelineObjectFactory.createDownstreamKeyerFullPilotTimelineObject(blueprintConfiguration),
      this.videoMixerTimelineObjectFactory.createUpstreamKeyerFullPilotTimelineObject(
        blueprintConfiguration,
        upstreamStart
      ),
      this.audioTimelineObjectFactory.createFullPilotTimelineObject(blueprintConfiguration)
    ]
  }

  private createCasparCgFullscreen(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: Tv2GraphicsActionManifest[] ): Tv2PartAction[] {
    return actionManifests.map((manifest) => this.createCasparCgGraphicsActionFromManifest(
      blueprintConfiguration,
      manifest
    ))
  }

  private createCasparCgGraphicsActionFromManifest(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest): Tv2PartAction {
    if (!blueprintConfiguration.studio.HTMLGraphics) {
      throw new MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. ' +
        'Make sure it exists, and contains a value for \'KeepAliveDuration\''
      )
    }

    const target: Tv2GraphicsTarget = Tv2GraphicsTarget.FULL
    const partId: string = `${this.getGraphicTargetAsCamelString(target)}Part`
    const fullGraphicPiece: PieceInterface = this.createCasparCgFullGraphicsPiece(blueprintConfiguration, manifest, partId)
    const partInterface: PartInterface = this.createGraphicsPartInterface({
      id: partId,
      name: `${this.getGraphicTargetAsCamelString(target)} ${manifest.userData.name}`,
      inTransition: {
        keepPreviousPartAliveDuration: blueprintConfiguration.studio.HTMLGraphics.KeepAliveDuration,
        delayPiecesDuration: 0
      },
    })

    return {
      id: `manifestAction_${manifest.userData.name.replaceAll('/', '')}`,
      name: `Manifest Action - ${manifest.userData.name}`,
      type: PartActionType.INSERT_PART_AS_NEXT,
      data: {
        partInterface: partInterface,
        pieceInterfaces: [ fullGraphicPiece ]
      },
      metadata: {
        contentType: Tv2ActionContentType.GRAPHICS
      }
    }
  }

  private createCasparCgFullGraphicsPiece(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest, partId: string): PieceInterface {
    return this.createGraphicsPieceInterface({
      id: 'fullGraphicPiece',
      partId,
      name: manifest.userData.name,
      preRollDuration: blueprintConfiguration.studio.CasparPrerollDuration,
      pieceLifespan: this.findInfiniteModeFromConfig(blueprintConfiguration, manifest),
      layer: Tv2SourceLayer.PILOT_GRAPHICS,
      content: this.createCasparCgFullGraphicsPieceContent(blueprintConfiguration, manifest)
    })
  }

  private createCasparCgFullGraphicsPieceContent(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest): Tv2TimelineObjectGraphicsContent {
    const rawGraphicsFolder: string | undefined = blueprintConfiguration.studio.GraphicFolder
    const graphicsFolder: string = rawGraphicsFolder ? `${rawGraphicsFolder}\\` : ''
    const sceneChunks: string[] = manifest.userData.name.split('/')
    const sceneName: string = sceneChunks[sceneChunks.length - 1]
    const fileName: string = this.casparCgPathFixer.joinAssetToFolder(sceneName, rawGraphicsFolder)

    return {
      fileName,
      path: this.casparCgPathFixer.joinAssetToNetworkPath(blueprintConfiguration.studio.GraphicNetworkBasePath, sceneName, blueprintConfiguration.studio.GraphicFileExtension, graphicsFolder),
      mediaFlowIds: [blueprintConfiguration.studio.GraphicMediaFlowId],
      ignoreMediaObjectStatus: blueprintConfiguration.studio.GraphicIgnoreStatus,
      ignoreBlackFrames: true,
      ignoreFreezeFrame: true,
      timelineObjects: [
        this.casparCgGraphicsTimelineObjectFactory.createFullGraphicsTimelineObject(blueprintConfiguration, manifest),
        ...this.createCasparCgFullPilotGraphicsTimelineObjects(blueprintConfiguration)
      ]
    }
  }

  private createCasparCgFullPilotGraphicsTimelineObjects(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject[] {
    if (!blueprintConfiguration.studio.HTMLGraphics) {
      throw new MisconfigurationException(
        'Missing configuration of \'HTMLGraphics\' in settings. ' +
        'Make sure it exists, and contains a value for \'TransitionSettings.wipeRate\' and  \'TransitionSettings.borderSoftness\''
      )
    }

    const start: number = blueprintConfiguration.studio.CasparPrerollDuration
    const input: number = this.getDownstreamkeyerMatchingRole(blueprintConfiguration, Tv2DownstreamKeyerRole.FULL_GRAPHICS).Fill
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
      this.videoMixerTimelineObjectFactory.createProgramTimelineObject(start, input, transition, transitionSettings),
      this.videoMixerTimelineObjectFactory.createCleanTimelineObject(start, input, transition, transitionSettings),
      this.videoMixerTimelineObjectFactory.createNextAuxTimelineObject(input),
      this.audioTimelineObjectFactory.createFullPilotTimelineObject(blueprintConfiguration),
    ]
  }

  // Todo: merge usage with copy in 'Tv2AtemVideoMixerTimelineObjectFactory'
  private getDownstreamkeyerMatchingRole(blueprintConfiguration: Tv2BlueprintConfiguration, role: Tv2DownstreamKeyerRole): Tv2DownstreamKeyer {
    return blueprintConfiguration.studio.SwitcherSource.DSK.find(
      downstreamKeyer => downstreamKeyer.Roles.some(
        keyerRole => keyerRole === role)) ?? blueprintConfiguration.studio.SwitcherSource.DSK[0]
  }
}
