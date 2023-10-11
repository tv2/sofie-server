import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action, PieceAction } from '../../../model/entities/action'
import {
  Tv2VideoSwitcherTimelineObjectFactory
} from '../value-objects/factories/tv2-video-switcher-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import { PieceInterface } from '../../../model/entities/piece'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PieceActionType } from '../../../model/enums/action-type'
import { PieceType } from '../../../model/enums/piece-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'

export class Tv2VideoSwitcherActionFactory {
  constructor(private readonly videoSwitcherTimelineObjectFactory: Tv2VideoSwitcherTimelineObjectFactory) {
  }

  public createVideoSwitcherActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      ...this.createDownstreamKeyerOnActions(blueprintConfiguration),
      ...this.createDownstreamKeyerOffActions(blueprintConfiguration)
    ]
  }

  private createDownstreamKeyerOffActions(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction[] {
    return blueprintConfiguration.studio.SwitcherSource.DSK.map(config => this.createDownStreamKeyerAction(config, 'Off', false))
  }

  private createDownStreamKeyerAction(downstreamKeyer: Tv2DownstreamKeyer, actionName: string, isOn: boolean): PieceAction {
    const downstreamKeyerNumber: string = String(downstreamKeyer.Number + 1)
    const layer: string = `${this.videoSwitcherTimelineObjectFactory.getDownstreamKeyerLayerPrefix()}_${downstreamKeyerNumber}` // Taken from Blueprints.
    const pieceInterface: PieceInterface = {
      ...this.createDefaultVideoSwitcherPieceInterface(),
      id: `downstreamKeyer${downstreamKeyerNumber}${actionName}Piece`,
      name: `DownstreamKeyer ${downstreamKeyerNumber} ${actionName}`,
      layer: layer,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      timelineObjects: [
        this.videoSwitcherTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, layer, isOn)
      ]
    }
    return {
      id: `downstreamKeyer${downstreamKeyerNumber}${actionName}Action`,
      name: `Downstream Keyer ${downstreamKeyerNumber} ${actionName}`,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: pieceInterface
    }
  }


  private createDefaultVideoSwitcherPieceInterface(): PieceInterface {
    return {
      id: '',
      name: '',
      duration: 0,
      partId: '',
      type: PieceType.GRAPHIC, // Todo: Is this still correct, now that it is in a 'VideoSwitcher' factory?
      layer: Tv2SourceLayer.GRAPHIC_ACTION_COMMAND, // Todo: Is this still correct, now that it is in a 'VideoSwitcher' factory?
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

  private createDownstreamKeyerOnActions(blueprintConfiguration: Tv2BlueprintConfiguration): PieceAction[] {
    return blueprintConfiguration.studio.SwitcherSource.DSK.map(config => this.createDownStreamKeyerAction(config, 'On', true))
  }
}