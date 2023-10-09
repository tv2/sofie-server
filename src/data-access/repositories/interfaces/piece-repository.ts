import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
  getPieces(partId: string): Promise<Piece[]>
  savePiece(piece: Piece): Promise<void>
  deletePiecesForPart(partId: string): Promise<void>
}
