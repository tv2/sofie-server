import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
  getPiece(partId: string): Promise<Piece>
}
