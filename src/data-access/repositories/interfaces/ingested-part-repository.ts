import { IngestedPart } from '../../../model/entities/ingested-part'

export interface IngestedPartRepository {
  getIngestedPart(partId: string): Promise<IngestedPart>
  getIngestedParts(segmentId: string): Promise<IngestedPart[]>
  deleteIngestedPartsForRundown(rundownId: string): Promise<void>
}
