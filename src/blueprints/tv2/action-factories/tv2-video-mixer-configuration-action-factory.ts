import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2DownstreamKeyer } from '../value-objects/tv2-studio-blueprint-configuration'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { PieceActionType } from '../../../model/enums/action-type'
import { Tv2PieceLayer } from '../value-objects/tv2-layers'
import { TransitionType } from '../../../model/enums/transition-type'
import {
  Tv2Action,
  Tv2ActionSubtype,
  Tv2PieceAction,
  Tv2ToggleDownstreamKeyerAction
} from '../value-objects/tv2-action'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { ActionFactory } from './action-factory'
import { OutputLayer } from '../../../model/enums/output-layer'
import { PlayoutContentType } from '../../../model/enums/playout-content-type'
import { OutputChannel } from '../../../model/enums/output-channel'
import { DownstreamKeyerPlayoutContent, PlayoutContent } from '../../../model/value-objects/playout-content'
import { Action, MutateActionMethods, MutateActionType } from '../../../model/entities/action'

export class Tv2VideoMixerConfigurationActionFactory extends ActionFactory {

  constructor(private readonly videoSwitcherTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory) {
    super()
  }

  public createVideoMixerActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2Action[] {
    return [
      ...this.createDownstreamKeyerOffActions(blueprintConfiguration),
      ...this.createDownstreamKeyerOnActions(blueprintConfiguration),
      ...this.createEmptyDownstreamKeyerToggleActions(blueprintConfiguration)
    ]
  }

  public isVideoMixerAction(action: Tv2Action): boolean {
    return action.metadata.playoutContent.type === PlayoutContentType.DOWNSTREAM_KEYER
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    switch (action.metadata.actionSubtype) {
      case Tv2ActionSubtype.TOGGLE_DOWNSTREAM_KEYER: {
        return [
          {
            type: MutateActionType.PLAYOUT_CONTENT,
            updateActionWithPlayoutContent: (action: Action, playoutContent: PlayoutContent) => this.updateToggleDownstreamKeyerActionFromPlayoutContent(action, playoutContent),
            playoutContentPredicate: (playoutContent: PlayoutContent) => this.isPlayoutContentDownstreamKeyerPlayoutContent(playoutContent, action.metadata.playoutContent as DownstreamKeyerPlayoutContent)
          }
        ]
      }
    }
    return []
  }

  private isPlayoutContentDownstreamKeyerPlayoutContent(playoutContent: PlayoutContent, downstreamKeyerPlayoutContent: DownstreamKeyerPlayoutContent): boolean {
    return playoutContent.type === downstreamKeyerPlayoutContent.type
      && playoutContent.identifier === downstreamKeyerPlayoutContent.identifier
  }

  private createDownstreamKeyerOffActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction[] {
    return blueprintConfiguration.studio.videoMixerBasicConfiguration.downstreamKeyers.map(config => this.createDownStreamKeyerAction(config, 'Off', false))
  }

  private createDownStreamKeyerAction(downstreamKeyer: Tv2DownstreamKeyer, actionName: string, isOn: boolean): Tv2PieceAction {
    const downstreamKeyerNumber: string = String(downstreamKeyer.index + 1)
    const pieceInterface: Tv2PieceInterface = this.createVideoSwitcherPieceInterface({
      id: this.sanitizeStringForId(`downstreamKeyer${downstreamKeyerNumber}${actionName}Piece`),
      name: `DownstreamKeyer ${downstreamKeyerNumber} ${actionName}`,
      layer: `${Tv2PieceLayer.DOWNSTREAM_KEYER_ACTION_COMMAND}_${downstreamKeyerNumber}`,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      timelineObjects: [
        this.videoSwitcherTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyer, isOn)
      ]
    }, {
      type: PlayoutContentType.DOWNSTREAM_KEYER,
      identifier: downstreamKeyerNumber,
      isOn
    })
    return {
      id: this.sanitizeStringForId(`downstreamKeyer${downstreamKeyerNumber}${actionName}Action`),
      name: `Downstream Keyer ${downstreamKeyerNumber} ${actionName}`,
      rank: 0,
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.DOWNSTREAM_KEYER,
          identifier: downstreamKeyerNumber,
          isOn
        },
        outputChannel: OutputChannel.UNKNOWN
      }
    }
  }


  private createVideoSwitcherPieceInterface(pieceInterfaceWithRequiredValues: Pick<Tv2PieceInterface, 'id' | 'name'> & Partial<Tv2PieceInterface>, playoutContent: DownstreamKeyerPlayoutContent): Tv2PieceInterface {
    return {
      partId: '',
      rundownId: '',
      layer: Tv2PieceLayer.DOWNSTREAM_KEYER_ACTION_COMMAND,
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
        playoutContent,
        outputLayer: OutputLayer.SECONDARY
      },
      ...pieceInterfaceWithRequiredValues
    }
  }

  private createDownstreamKeyerOnActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2PieceAction[] {
    return blueprintConfiguration.studio.videoMixerBasicConfiguration.downstreamKeyers.map(config => this.createDownStreamKeyerAction(config, 'On', true))
  }

  private createEmptyDownstreamKeyerToggleActions(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2ToggleDownstreamKeyerAction[] {
    return blueprintConfiguration.studio.videoMixerBasicConfiguration.downstreamKeyers.map(downstreamKeyer => {
      const downstreamKeyerNumber: string = String(downstreamKeyer.index + 1)
      return {
        id: this.sanitizeStringForId(`downstreamKeyer${downstreamKeyerNumber}_toggle_action`),
        name: `Toggle DSK ${downstreamKeyerNumber}`,
        type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
        data: {
          pieceInterface: {} as Tv2PieceInterface // To be replaced by mutate actions
        },
        rank: 0,
        metadata: {
          playoutContent: {
            type: PlayoutContentType.DOWNSTREAM_KEYER,
            identifier: downstreamKeyerNumber,
            isOn: true
          },
          outputChannel: OutputChannel.UNKNOWN,
          actionSubtype: Tv2ActionSubtype.TOGGLE_DOWNSTREAM_KEYER,
          downstreamKeyerConfiguration: downstreamKeyer
        }
      }
    })
  }

  private updateToggleDownstreamKeyerActionFromPlayoutContent(action: Action, playoutContent: PlayoutContent): Action {
    if (playoutContent.type !== PlayoutContentType.DOWNSTREAM_KEYER) {
      return action
    }

    const downstreamKeyerAction: Tv2ToggleDownstreamKeyerAction = action as Tv2ToggleDownstreamKeyerAction

    const newPlayoutContent: DownstreamKeyerPlayoutContent = {
      type: PlayoutContentType.DOWNSTREAM_KEYER,
      identifier: playoutContent.identifier,
      isOn: !playoutContent.isOn
    }

    const onOffString: string = newPlayoutContent.isOn ? 'On' : 'Off'

    downstreamKeyerAction.data.pieceInterface = this.createVideoSwitcherPieceInterface({
      id: `toggle_downstream_keyer_${newPlayoutContent.identifier}_${onOffString}_piece`,
      name: `Toggle DSK ${newPlayoutContent.identifier} ${onOffString}`,
      layer: `${Tv2PieceLayer.DOWNSTREAM_KEYER_ACTION_COMMAND}_${newPlayoutContent.identifier}`,
      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      timelineObjects: [
        this.videoSwitcherTimelineObjectFactory.createDownstreamKeyerTimelineObject(downstreamKeyerAction.metadata.downstreamKeyerConfiguration, newPlayoutContent.isOn)
      ]
    }, newPlayoutContent)

    return downstreamKeyerAction
  }
}
