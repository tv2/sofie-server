import { Tv2Action, Tv2ActionSubtype, Tv2PieceAction, Tv2RobotAction } from '../value-objects/tv2-action'
import { PieceActionType } from '../../../rundown-execution/domain/enums/action-type'
import { PieceInterface } from '../../../rundown-execution/domain/entities/piece'
import { Action, ActionArgumentType, MutateActionMethods, MutateActionType } from '../../../rundown-execution/domain/entities/action'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import { Tv2PieceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../rundown-execution/domain/enums/piece-lifespan'
import { TransitionType } from '../../../rundown-execution/domain/enums/transition-type'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import {
  Tv2RobotTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-robot-timeline-object-factory'
import { ActionFactory } from './action-factory'
import { OutputLayer } from '../../../rundown-execution/domain/enums/output-layer'
import { PlayoutContentType } from '../../../rundown-execution/domain/enums/playout-content-type'
import { OutputChannel } from '../../../rundown-execution/domain/enums/output-channel'

export class Tv2RobotActionFactory extends ActionFactory {

  constructor(private readonly robotTimelineObjectFactory: Tv2RobotTimelineObjectFactory) {
    super()
  }

  public createRobotActions(): Tv2PieceAction[] {
    return [
      this.createCallRobotPresetAction()
    ]
  }

  private createCallRobotPresetAction(): Tv2RobotAction {
    return {
      id: 'callRobotPresetAction',
      name: 'Robot Preset',
      rank: 0,
      description: 'Calls the preset parsed as the argument',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      data: {
        pieceInterface: {} as PieceInterface
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.ROBOT
        },
        outputChannel: OutputChannel.PROGRAM,
        actionSubtype: Tv2ActionSubtype.CALL_PRESET
      },
      argument: {
        name: 'Preset',
        description: 'The preset to be called provided as a number',
        type: ActionArgumentType.NUMBER
      }
    }
  }

  public isRobotAction(action: Tv2Action): action is Tv2RobotAction {
    return action.metadata.playoutContent.type === PlayoutContentType.ROBOT
  }

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    if (!this.isRobotAction(action)) {
      return []
    }
    switch (action.metadata.actionSubtype) {
      case Tv2ActionSubtype.CALL_PRESET: {
        return [{
          type: MutateActionType.APPLY_ARGUMENTS,
          updateActionWithArguments: (action: Action, actionArguments: unknown) => this.applyArgumentsToCallPresetAction(action, actionArguments)
        }]
      }
      default: {
        return []
      }
    }
  }

  private applyArgumentsToCallPresetAction(action: Action, actionArguments: unknown): Action {
    if (!this.isCallPresetArgumentInteger(actionArguments)) {
      throw new Tv2MisconfigurationException(`CallPresetAction expects the 'actionArgument' to be an integer. ${actionArguments} is not an integer`)
    }
    const robotAction: Tv2RobotAction = action as Tv2RobotAction
    robotAction.data.pieceInterface = this.createCallPresetPieceInterface(actionArguments)
    return robotAction
  }

  private isCallPresetArgumentInteger(callPresetArgument: unknown): callPresetArgument is number {
    if (!Number.isInteger(callPresetArgument)) {
      throw new Tv2MisconfigurationException(`The preset to be called must be an integer. ${callPresetArgument} is not an integer`)
    }
    return true
  }

  private createCallPresetPieceInterface(preset: number): Tv2PieceInterface {
    return {
      id: `callRobotPreset_${this.sanitizeStringForId(preset + '')}`,
      name: `Call Preset ${preset}`,
      partId: '',
      rundownId: '',
      layer: Tv2PieceLayer.ROBOT_CAMERA,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 100,
      takenOffAirTimestamp: 0,
      postRollDuration: 0,
      preRollDuration: 0,
      tags: [],
      isUnsynced: false,
      timelineObjects: [
        this.robotTimelineObjectFactory.createCallPresetTimelineObject(preset)
      ],
      metadata: {
        playoutContent: {
          type: PlayoutContentType.COMMAND
        },
        outputLayer: OutputLayer.SECONDARY
      }
    }
  }
}
