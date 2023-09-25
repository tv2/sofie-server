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
  type: ActionType.INSERT_PART_AS_NEXT | ActionType.INSERT_PART_AS_ON_AIR
  data: {
    partInterface: PartInterface,
    pieceInterfaces: PieceInterface[]
  }
}

export interface PieceAction extends Action {
  type: ActionType.INSERT_PIECE_AS_ON_AIR
  data: PieceInterface
}
