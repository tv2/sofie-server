import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
  getPiecesFromIds(pieceIds: string[]): Promise<Piece[]>
  deleteUnsyncedInfinitePiecesNotOnAnyRundown(): Promise<void>
  deleteAllUnsyncedPieces(): Promise<void>
  deleteAllUnplannedPieces(): Promise<void>
}
