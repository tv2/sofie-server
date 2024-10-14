import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
  getPiecesFromIds(pieceIds: string[]): Promise<Piece[]>
}
