import { IngestedPart } from '../../../model/entities/ingested-part'
import { IngestedPiece } from '../../../model/entities/ingested-piece'

export interface IngestedPartRepository {
  getIngestedPartsForRundown(rundownId: string, ingestedPieces: readonly IngestedPiece[]): Promise<IngestedPart[]>
  deleteIngestedPartsForRundown(rundownId: string): Promise<void>
}
