import { IngestedPiece } from '../../../model/entities/ingested-piece'

export interface IngestedPieceRepository {
  getIngestedPieces(partId: string): Promise<IngestedPiece[]>
  deleteIngestedPiecesForRundown(rundownId: string): Promise<void>
}
