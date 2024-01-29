import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
  getPieces(partId: string): Promise<Piece[]>
  getPiecesFromIds(pieceIds: string[]): Promise<Piece[]>
  savePiece(piece: Piece): Promise<void>
  deletePiecesForPart(partId: string): Promise<void>
  deletePieces(pieceIdsToBeDeleted: string[]): Promise<void>
  deleteUnsyncedInfinitePiecesNotOnAnyRundown(): Promise<void>
  deleteAllUnsyncedPieces(): Promise<void>
  deleteAllUnplannedPieces(): Promise<void>
}
