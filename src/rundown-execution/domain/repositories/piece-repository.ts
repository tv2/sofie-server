import { Piece } from '../entities/piece'

export interface PieceRepository {
  getPiece(partId: string): Promise<Piece>
}
