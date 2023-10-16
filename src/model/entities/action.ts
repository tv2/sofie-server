import { ActionType, PartActionType, PieceActionType } from '../enums/action-type'
import { PartInterface } from './part'
import { Piece, PieceInterface } from './piece'

export interface Action<Metadata = unknown> {
  id: string
  name: string
  description?: string
  type: ActionType
  data: unknown
  metadata?: Metadata
}

export interface PartAction extends Action {
  type: PartActionType
  data: {
    partInterface: PartInterface,
    pieceInterfaces: PieceInterface[]
  }
}

export interface PieceAction extends Action {
  type: PieceActionType
  data: PieceInterface
}

export interface MutateActionMethods {
  updateActionWithPlannedPieceData: (action: Action, plannedPiece: Piece) => Action
  plannedPiecePredicate: (piece: Piece) => boolean
}
