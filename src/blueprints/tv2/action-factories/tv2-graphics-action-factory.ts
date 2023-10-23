import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Tv2GraphicsActionManifest } from '../value-objects/tv2-action-manifest'
import { Tv2GraphicsType } from '../value-objects/tv2-studio-blueprint-configuration'
import { PartInterface } from '../../../model/entities/part'
import { Tv2GraphicsTarget } from '../value-objects/tv2-graphics-target'
import { Tv2TimelineObjectGraphicContent } from '../value-objects/tv2-content'
import { AtemFullPilotTimelineObjectProperties, AtemTransition } from '../../timeline-state-resolver-types/atem-types'
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

export class Tv2GraphicsActionFactory {
  constructor(
    private readonly vizGraphicsTimelineObjectFactory: Tv2VizGraphicsTimelineObjectFactory,
    // private readonly casparCgGraphicsTimelineObjectFactory: Tv2CasparCgGraphicsTimelineObjectFactory,
    private readonly audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory,
    private readonly videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory
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
    const fullGraphicPiece: PieceInterface = this.createVizFullGraphicsPiece(blueprintConfiguration, manifest)
    const partInterface: PartInterface = this.createGraphicsPartInterface({
      id: `${this.getGraphicTargetAsCamelString(target)}Part`, // Todo: make id unique
      name: `${this.getGraphicTargetAsCamelString(target)} ${manifest.userData.name}`,
      inTransition: {
        keepPreviousPartAliveDuration: blueprintConfiguration.studio.VizPilotGraphics.KeepAliveDuration,
        delayPiecesDuration: 0
      },
    })
    return {
      id: '',
      name: '',
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

  private createVizFullGraphicsPiece(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest): PieceInterface {
    return this.createGraphicsPieceInterface({
      id: 'fullGraphicPiece', // Todo: make id unique
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
    return target.toString().charAt(0) + target.toString().substring(1).toLowerCase()
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
  ): Tv2TimelineObjectGraphicContent {
    return {
      fileName: `PILOT_${manifest.userData.vcpid}`,
      path: manifest.userData.vcpid.toString(),
      timelineObjects: [
        ...this.videoMixerTimelineObjectFactory.createFullPilotTimelineObjects(blueprintConfiguration, this.createVizFullPilotTimelineObjectProperties(blueprintConfiguration)),
        ...this.videoMixerTimelineObjectFactory.createDownstreamKeyerFullPilotTimelineObjects(blueprintConfiguration),
        ...this.audioTimelineObjectFactory.createFullPilotGraphicsTimelineObjects(blueprintConfiguration),
      ]
    }
  }

  private createVizFullPilotTimelineObjectProperties(blueprintConfiguration: Tv2BlueprintConfiguration): AtemFullPilotTimelineObjectProperties {
    return {
      enable: {
        start: blueprintConfiguration.studio.VizPilotGraphics.CutToMediaPlayer
      },
      content: {
        input: blueprintConfiguration.studio.VizPilotGraphics.FullGraphicBackground,
        transition: AtemTransition.CUT
      }
    }
  }



  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private createCasparCgFullscreen(blueprintConfiguration: Tv2BlueprintConfiguration, _actionManifests: Tv2GraphicsActionManifest[] ): Tv2PartAction[] {
    this.createCasparCgFullPilotTimelineObjectProperties(blueprintConfiguration)
    throw new Error('Method not implemented.')
  }

  private createCasparCgFullPilotTimelineObjectProperties(blueprintConfiguration: Tv2BlueprintConfiguration): AtemFullPilotTimelineObjectProperties {
    return {
      enable: {
        start: blueprintConfiguration.studio.CasparPrerollDuration
      },
      content: {
        input: -1, //Todo: find 'fill' value for Full Dsk.
        transition: AtemTransition.WIPE,
        transitionSettings: {
          wipe: {
            rate: blueprintConfiguration.studio.HTMLGraphics.TransitionSettings.wipeRate,
            pattern: 1,
            reverseDirection: true,
            borderSoftness: blueprintConfiguration.studio.HTMLGraphics.TransitionSettings.borderSoftness
          }
        }
      }
    }
  }
}
