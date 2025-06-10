import { Piece } from '../../../rundown-execution/domain/entities/piece'

export interface PieceRepository {
  getPiece(partId: string): Promise<Piece>
}
