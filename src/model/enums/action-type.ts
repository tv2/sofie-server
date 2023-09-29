export type ActionType = PartActionType | PieceActionType

export enum PartActionType {
  INSERT_PART_AS_ON_AIR = 'INSERT_PART_AS_ON_AIR',
  INSERT_PART_AS_NEXT = 'INSERT_PART_AS_NEXT',
}

export enum PieceActionType {
  INSERT_PIECE_AS_ON_AIR = 'INSERT_PIECE_AS_ON_AIR',
  INSERT_PIECE_AS_NEXT = 'INSERT_PIECE_AS_NEXT'
}