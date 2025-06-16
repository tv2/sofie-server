export type ActionType = SystemActionType | PartActionType | PieceActionType

export enum SystemActionType {
  SYSTEM_ACTION = 'SYSTEM_ACTION',
}

export enum PartActionType {
  INSERT_PART_AS_ON_AIR = 'INSERT_PART_AS_ON_AIR',
  INSERT_PART_AS_NEXT = 'INSERT_PART_AS_NEXT',
}

export enum PieceActionType {
  INSERT_PIECE_AS_ON_AIR = 'INSERT_PIECE_AS_ON_AIR',
  INSERT_PIECE_AS_NEXT = 'INSERT_PIECE_AS_NEXT',
  INSERT_PIECE_AS_NEXT_AND_TAKE = 'INSERT_PIECE_AS_NEXT_AND_TAKE',
  REPLACE_PIECE = 'REPLACE_PIECE',
}
