import { IngestedPart } from '../../../model/entities/ingested-part'

export interface IngestedPartRepository {
  getIngestedPartsForSegment(segmentId: string): Promise<IngestedPart[]>
  deleteIngestedPartsForRundown(rundownId: string): Promise<void>
}
