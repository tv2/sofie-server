import { IngestedSegment } from '../../../model/entities/ingested-segment'

export interface IngestedSegmentRepository {
  getIngestedSegmentRundown(rundownId: string): Promise<IngestedSegment>
  getIngestedSegmentsByRundown(rundownId: string): Promise<IngestedSegment[]>
  deleteIngestedSegmentsForRundown(rundownId: string): Promise<void>
}
