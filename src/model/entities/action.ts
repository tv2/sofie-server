import { ActionType } from '../enums/action-type'
import { PartInterface } from './part'
import { PieceInterface } from './piece'

export interface Action {
  id: string
  name: string
  type: ActionType
  data: unknown
}

export interface PartAction extends Action {
  type: ActionType.INSERT_PART | ActionType.INSERT_AND_TAKE_PART
  data: {
    partInterface: PartInterface,
    pieceInterfaces: PieceInterface[]
  }
}

export interface InsertPieceAction extends Action {
  type: ActionType.INSERT_PIECE
  data: PieceInterface
}
