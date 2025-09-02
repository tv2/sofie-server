import { IngestedSegment } from '../../../rundown-execution/domain/entities/ingested-segment'
import { IngestedPart } from '../../../rundown-execution/domain/entities/ingested-part'

export interface IngestedSegmentRepository {
  getIngestedSegmentsForRundown(rundownId: string, ingestedParts: readonly IngestedPart[]): Promise<IngestedSegment[]>
  deleteIngestedSegmentsForRundown(rundownId: string): Promise<void>
}
