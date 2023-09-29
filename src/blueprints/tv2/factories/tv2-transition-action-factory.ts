import { Action, MutateActionMethods, PieceAction } from '../../../model/entities/action'
import { ActionType } from '../../../model/enums/action-type'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { PieceType } from '../../../model/enums/piece-type'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { Tv2AtemLayer, Tv2SourceLayer } from '../value-objects/tv2-layers'
import { AtemMeTimelineObject, AtemTransition, AtemType } from '../../timeline-state-resolver-types/atem-types'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2BlueprintTimelineObject } from '../value-objects/tv2-metadata'
import { TimelineObject } from '../../../model/entities/timeline-object'

const FRAME_RATE: number = 25

const FRAMES_FOR_MIX_TRANSITION: number = 25 // TODO: Get from configuration.

const MIX_TRANSITION_ID: string = 'nextTakeHasMixTransitionAction'

export class Tv2TransitionActionFactory {

  public isTransitionAction(action: Action): boolean {
    return [MIX_TRANSITION_ID].includes(action.id)
  }

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    switch (action.id) {
      case MIX_TRANSITION_ID: {
        return {
          updateActionWithPlannedPieceData: (action: Action, plannedPiece: Piece) => this.updateAtemMeInput(action, plannedPiece),
          plannedPiecePredicate: (piece: Piece) => piece.timelineObjects.some(timelineObject => timelineObject.layer === Tv2AtemLayer.PROGRAM)
        }
      }
    }
  }

  public createMixTransitionAction(): PieceAction {
    const pieceInterface: PieceInterface = {
      id: 'mixTransitionActionPiece',
      name: 'Mix transition',
      partId: '',
      type: PieceType.TRANSITION,
      layer: Tv2SourceLayer.JINGLE,
      pieceLifespan: PieceLifespan.WITHIN_PART,
      transitionType: TransitionType.IN_TRANSITION,
      isPlanned: false,
      start: 0,
      duration: this.getTimeFromFrames(FRAMES_FOR_MIX_TRANSITION),
      postRollDuration: 0,
      preRollDuration: 0,
      tags: [],
      timelineObjects: []
    }

    return {
      id: MIX_TRANSITION_ID,
      name: 'Mix transition on next take',
      type: ActionType.INSERT_PIECE_AS_NEXT,
      data: pieceInterface
    }
  }

  private getTimeFromFrames(frames: number): number {
    return (1000 / FRAME_RATE) * frames
  }

  private createAtemMixTransitionTimelineObject(sourceInput: number): AtemMeTimelineObject {
    return {
      id: '',
      enable: {
        start: 0
      },
      layer: Tv2AtemLayer.PROGRAM,
      priority: 10,
      content: {
        deviceType: DeviceType.ATEM,
        type: AtemType.ME,
        me: {
          input: sourceInput,
          transition: AtemTransition.MIX,
          transitionSettings: {
            mix: {
              rate: FRAMES_FOR_MIX_TRANSITION
            }
          }
        }
      }
    }
  }

  private updateAtemMeInput(action: Action, plannedPiece: Piece): Action {
    const timelineObject: TimelineObject | undefined = plannedPiece.timelineObjects.find(timelineObject => timelineObject.layer === Tv2AtemLayer.PROGRAM)
    if (!timelineObject) {
      console.log(`Can't update Atem Me Input. No TimelineObject for '${Tv2AtemLayer.PROGRAM}' found on Piece '${plannedPiece.id}'.`)
      return action
    }
    const blueprintTimelineObject: Tv2BlueprintTimelineObject = timelineObject as Tv2BlueprintTimelineObject
    if (blueprintTimelineObject.content.deviceType !== DeviceType.ATEM || blueprintTimelineObject.content.type !== AtemType.ME) {
      console.log('Can\'t update Atem Me Input. TimelineObject is not an Atem Me TimelineObject.')
      return action
    }

    const atemMeTimelineObject: AtemMeTimelineObject = blueprintTimelineObject as AtemMeTimelineObject
    const sourceInput: number = atemMeTimelineObject.content.me.input
    const mixTransitionTimelineObject: AtemMeTimelineObject = this.createAtemMixTransitionTimelineObject(sourceInput)

    const pieceAction: PieceAction = action as PieceAction
    pieceAction.data.timelineObjects.push(mixTransitionTimelineObject)
    return pieceAction
  }
}
