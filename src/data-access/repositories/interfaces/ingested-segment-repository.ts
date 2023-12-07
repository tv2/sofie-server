import { IngestedSegment } from '../../../model/entities/ingested-segment'

export interface IngestedSegmentRepository {
  getIngestedSegment(segmentId: string): Promise<IngestedSegment>
  getIngestedSegmentsForRundown(rundownId: string): Promise<IngestedSegment[]>
  deleteIngestedSegmentsForRundown(rundownId: string): Promise<void>
}
