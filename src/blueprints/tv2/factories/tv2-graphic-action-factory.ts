import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, PieceAction } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2GraphicTimelineObjectFactory } from '../value-objects/factories/tv2-graphic-timeline-object-factory'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PieceActionType } from '../../../model/enums/action-type'

export class Tv2GraphicActionFactory {
  constructor(
    private readonly graphicTimelineObjectFactory: Tv2GraphicTimelineObjectFactory
  ) { }

  public createGraphicActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createThemeOutAction(blueprintConfiguration),
      this.createOverlayInitializeAction(),
      this.createContinueGraphicAction(),
      this.createClearGraphicAction(blueprintConfiguration),
      this.createAllOutGraphicAction(blueprintConfiguration),
    ]
  }

  private createAllOutGraphicAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = this.createGraphicPieceInterface({
      id: 'allOutGraphicPiece',
      name: 'Gfx All Out',
      duration,
      timelineObjects: [
        this.graphicTimelineObjectFactory.createAllOutGraphicTimelineObject(blueprintConfiguration, duration)
      ]
    })
    return {
      id: 'allOutGraphicAction',
      name: 'Gfx All Out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createClearGraphicAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = this.createGraphicPieceInterface({
      id: 'clearGraphicPiece',
      name: 'Gfx Clear',
      duration,
      timelineObjects: [
        this.graphicTimelineObjectFactory.createClearGraphicTimelineObject(blueprintConfiguration, duration)
      ]
    })
    return {
      id: 'clearGraphicAction',
      name: 'Gfx Clear',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createContinueGraphicAction(): PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: PieceInterface = this.createGraphicPieceInterface({
      id: 'continueGraphicPiece',
      name: 'Gfx continue',
      duration,
      timelineObjects: [
        this.graphicTimelineObjectFactory.createContinueGraphicTimelineObject(duration)
      ]
    })
    return {
      id: 'continueGraphicAction',
      name: 'Gfx continue',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createThemeOutAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = this.createGraphicPieceInterface({
      id: 'themeOutPiece',
      name: 'Theme Out',
      duration,
      timelineObjects: [
        this.graphicTimelineObjectFactory.createThemeOutTimelineObject(
          blueprintConfiguration,
          duration
        )
      ]
    })
    return {
      id: 'themeOutAction',
      name: 'Theme out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createGraphicPieceInterface(pieceInterfaceWithRequiredValues: Pick<PieceInterface, 'id' | 'name'> & Partial<PieceInterface>): PieceInterface {
    return {
      duration: 0,
      partId: '',
      type: PieceType.GRAPHIC,
      layer: Tv2SourceLayer.GRAPHIC_ACTION_COMMAND,
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

  private createOverlayInitializeAction(): PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: PieceInterface = this.createGraphicPieceInterface({
      id: 'overlayInitializePiece',
      name: 'Overlay Initialize',
      duration,
      timelineObjects: [
        this.graphicTimelineObjectFactory.createOverlayInitializeTimelineObject(duration)
      ]
    })
    return {
      id: 'overlayInitializeAction',
      name: 'Overlay initialize',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }


}