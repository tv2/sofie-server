import { IngestedPart } from '../../../rundown-execution/domain/entities/ingested-part'
import { IngestedPiece } from '../../../rundown-execution/domain/entities/ingested-piece'

export interface IngestedPartRepository {
  getIngestedPartsForRundown(rundownId: string, ingestedPieces: readonly IngestedPiece[]): Promise<IngestedPart[]>
  deleteIngestedPartsForRundown(rundownId: string): Promise<void>
}
