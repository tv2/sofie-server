import { Segment } from '../../../model/entities/segment'

export interface SegmentRepository {
  getSegment(segmentId: string): Promise<Segment>
  deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void>
  deleteAllUnsyncedSegments(): Promise<void>
}
