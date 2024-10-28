import { IngestedSegment } from '../../../model/entities/ingested-segment'
import { IngestedPart } from '../../../model/entities/ingested-part'

export interface IngestedSegmentRepository {
  getIngestedSegmentsForRundown(rundownId: string, ingestedParts: readonly IngestedPart[]): Promise<IngestedSegment[]>
  deleteIngestedSegmentsForRundown(rundownId: string): Promise<void>
}
