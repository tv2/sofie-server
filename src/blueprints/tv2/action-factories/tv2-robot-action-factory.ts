import {
  Tv2Action,
  Tv2ActionContentType,
  Tv2ActionSubtype,
  Tv2PieceAction,
  Tv2RobotAction
} from '../value-objects/tv2-action'
import { PieceActionType } from '../../../model/enums/action-type'
import { PieceInterface } from '../../../model/entities/piece'
import { Action, ActionArgumentType, MutateActionMethods, MutateActionType } from '../../../model/entities/action'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import { Tv2SourceLayer } from '../value-objects/tv2-layers'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { Tv2PieceInterface } from '../entities/tv2-piece-interface'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2OutputLayer } from '../enums/tv2-output-layer'
import {
  Tv2RobotTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-robot-timeline-object-factory'

export class Tv2RobotActionFactory {

  constructor(private readonly robotTimelineObjectFactory: Tv2RobotTimelineObjectFactory) {
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
        contentType: Tv2ActionContentType.ROBOT,
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
    return action.metadata.contentType === Tv2ActionContentType.ROBOT
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
      id: `callRobotPreset_${preset}`,
      name: `Call Preset ${preset}`,
      partId: '',
      layer: Tv2SourceLayer.ROBOT_CAMERA,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.NO_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: 100,
      postRollDuration: 0,
      preRollDuration: 0,
      tags: [],
      isUnsynced: false,
      timelineObjects: [
        this.robotTimelineObjectFactory.createCallPresetTimelineObject(preset)
      ],
      metadata: {
        type: Tv2PieceType.COMMAND,
        outputLayer: Tv2OutputLayer.SECONDARY
      }
    }
  }
}
