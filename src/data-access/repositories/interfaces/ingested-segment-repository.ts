import { IngestedSegment } from '../../../model/entities/ingested-segment'

export interface IngestedSegmentRepository {
  getIngestedSegmentsForRundown(rundownId: string): Promise<IngestedSegment[]>
  deleteIngestedSegmentsForRundown(rundownId: string): Promise<void>
}
