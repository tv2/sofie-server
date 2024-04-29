import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Action } from '../../../model/entities/action'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PieceActionType } from '../../../model/enums/action-type'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2ActionContentType, Tv2PieceAction } from '../value-objects/tv2-action'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'

export class Tv2VideoMixerConfigurationActionFactory {
  constructor(private readonly videoSwitcherTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory) {
  }

  public createVideoMixerActions(blueprintConfiguration: Tv2BlueprintConfiguration): Action[] {
    return [
      ...this.createDownstreamKeyerOffActions(blueprintConfiguration),
      ...this.createDownstreamKeyerOnActions(blueprintConfiguration)
    ]
  }

  private createDownstreamKeyerOffActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction[] {
    return blueprintConfiguration.studio.videoMixerBasicConfiguration.downstreamKeyers.map(config => this.createDownStreamKeyerAction(config, 'Off', false))
  }

  private createDownStreamKeyerAction(downstreamKeyer: Tv2DownstreamKeyer, actionName: string, isOn: boolean): Tv2PieceAction {
    const downstreamKeyerNumber: string = String(downstreamKeyer.index + 1)
    const pieceInterface: Tv2PieceInterface = this.createVideoSwitcherPieceInterface({
      id: `downstreamKeyer${downstreamKeyerNumber}${actionName}Piece`,
      name: `DownstreamKeyer ${downstreamKeyerNumber} ${actionName}`,
      layer: `${Tv2SourceLayer.DOWNSTREAM_KEYER_ACTION_COMMAND}_${downstreamKeyerNumber}`,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      timelineObjects: [
        this.videoSwitcherTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, isOn)
      ]
    })
    return {
      id: `downstreamKeyer${downstreamKeyerNumber}${actionName}Action`,
      name: `Downstream Keyer ${downstreamKeyerNumber} ${actionName}`,
      rank: 0,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        contentType: Tv2ActionContentType.UNKNOWN
      }
    }
  }


  private createVideoSwitcherPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>): Tv2PieceInterface {
    return {
      partId: '',
      layer: Tv2SourceLayer.DOWNSTREAM_KEYER_ACTION_COMMAND,
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
        outputLayer: Tv2OutputLayer.SECONDARY
      },
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createDownstreamKeyerOnActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction[] {
    return blueprintConfiguration.studio.videoMixerBasicConfiguration.downstreamKeyers.map(config => this.createDownStreamKeyerAction(config, 'On', true))
  }
}
