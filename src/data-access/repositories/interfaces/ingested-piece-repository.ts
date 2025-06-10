import { IngestedPiece } from '../../../rundown-execution/domain/entities/ingested-piece'

export interface IngestedPieceRepository {
  getIngestedPiecesForRundown(rundownId: string): Promise<IngestedPiece[]>
  deleteIngestedPiecesForRundown(rundownId: string): Promise<void>
}
