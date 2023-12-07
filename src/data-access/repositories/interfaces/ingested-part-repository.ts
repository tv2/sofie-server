import { IngestedPart } from '../../../model/entities/ingested-part'

export interface IngestedPartRepository {
  getIngestedPart(partId: string): Promise<IngestedPart>
  getIngestedPartsForSegment(segmentId: string): Promise<IngestedPart[]>
  deleteIngestedPartsForRundown(rundownId: string): Promise<void>
}
