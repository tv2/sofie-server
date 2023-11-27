import { IngestedSegment } from '../../../model/entities/ingested-segment'

export interface IngestedSegmentRepository {
  getIngestedSegment(rundownId: string): Promise<IngestedSegment>
  getIngestedSegments(rundownId: string): Promise<IngestedSegment[]>
  deleteIngestedSegmentsForRundown(rundownId: string): Promise<void>
}
