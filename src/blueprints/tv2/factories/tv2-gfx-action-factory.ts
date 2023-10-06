import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, PieceAction } from '../../../model/entities/action'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2GfxTimelineObjectFactory } from '../value-objects/factories/tv2-gfx-timeline-object-factory'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PieceActionType } from '../../../model/enums/action-type'

export class Tv2GfxActionFactory {
  constructor(
    private readonly gfxTimelineObjectFactory: Tv2GfxTimelineObjectFactory
  ) { }

  public createGfxActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      this.createThemeOutAction(blueprintConfiguration),
      this.createOverlayInitializeAction(),
      this.createContinueGfxAction(),
      this.createGfxClearAction(blueprintConfiguration),
      this.createGfxAlternativeOutAction(blueprintConfiguration),
    ]
  }

  private createGfxAlternativeOutAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGfxPieceInterface(),
      id: 'gfxAlternativeOutPiece',
      name: 'Gfx Alternative Out',
      duration,
      timelineObjects: [
        this.gfxTimelineObjectFactory.createGfxAlternativeOutTimelineObject(blueprintConfiguration, duration)
      ]
    }
    return {
      id: 'gfxAlternativeOutAction',
      name: 'Gfx Alternative Out',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createGfxClearAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGfxPieceInterface(),
      id: 'gfxClearPiece',
      name: 'Gfx Clear',
      duration,
      timelineObjects: [
        this.gfxTimelineObjectFactory.createGfxClearTimelineObject(blueprintConfiguration, duration)
      ]
    }
    return {
      id: 'gfxClearAction',
      name: 'Gfx Clear',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createContinueGfxAction(): PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGfxPieceInterface(),
      id: 'continueGfxPiece',
      name: 'Continue gfx ',
      duration,
      timelineObjects: [
        this.gfxTimelineObjectFactory.createContinueGfxTimelineObject(duration)
      ]
    }
    return {
      id: 'continueGfxAction',
      name: 'Continue gfx',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }

  private createThemeOutAction(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction {
    const duration: number = 3000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGfxPieceInterface(),
      id: 'themeOutPiece',
      name: 'Theme Out',
      duration,
      timelineObjects: [
        this.gfxTimelineObjectFactory.createThemeOutTimelineObject(
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

  private createDefaultGfxPieceInterface(): PieceInterface {
    return {
      id: '',
      name: '',
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
    }
  }

  private createOverlayInitializeAction(): PieceAction {
    const duration: number = 1000 // Taken from Blueprints
    const pieceInterface: PieceInterface = {
      ...this.createDefaultGfxPieceInterface(),
      id: 'overlayInitializePiece',
      name: 'Overlay Initialize',
      duration,
      timelineObjects: [
        this.gfxTimelineObjectFactory.createOverlayInitializeTimelineObject(duration)
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