import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, PieceAction } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2GraphicsTimelineObjectFactory } from '../value-objects/factories/tv2-graphics-timeline-object-factory'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PieceActionType } from '../../../model/enums/action-type'

export class Tv2GraphicActionFactory {
  constructor(
    private readonly graphicsTimelineObjectFactory: Tv2GraphicsTimelineObjectFactory
  ) { }

  public createGraphicsActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createThemeOutAction(blueprintConfiguration),
      this.createOverlayInitializeAction(),
      this.createContinueGraphicsAction(),
    ]
  }

  private createContinueGraphicsAction(): PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGraphicPieceInterface(),
      id: 'continueGraphicPiece',
      name: 'Continue graphics ',
      duration,
      tags: [],
      timelineObjects: [
        this.graphicsTimelineObjectFactory.createContinueGraphicsTimelineObject(duration)
      ]
    }
    return {
      id: 'continueGraphicAction',
      name: 'Continue Graphic',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createThemeOutAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGraphicPieceInterface(),
      id: 'themeOutPiece',
      name: 'Theme Out',
      duration,
      tags: [],
      timelineObjects: [
        this.graphicsTimelineObjectFactory.createThemeOutTimelineObject(
          blueprintConfiguration,
          duration
        )
      ]
    }
    return {
      id: 'themeOutAction',
      name: 'Theme out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createDefaultGraphicPieceInterface(): PieceInterface {
    return {
      partId: '',
      type: PieceType.GRAPHIC,
      layer: Tv2SourceLayer.GRAPHIC_ACTION_COMMAND,
      transitionType: TransitionType.NO_TRANSITION,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      isPlanned: false,
      start: 0,
      preRollDuration: 0,
      postRollDuration: 0,
    } as PieceInterface
  }

  private createOverlayInitializeAction(): PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGraphicPieceInterface(),
      id: 'overlayInitializePiece',
      name: 'Overlay Initialize',
      duration,
      tags: [],
      timelineObjects: [
        this.graphicsTimelineObjectFactory.createOverlayInitializeTimelineObject(duration)
      ]
    }
    return {
      id: 'overlayInitializeAction',
      name: 'Overlay initialize',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }
}