import { Segment } from '../../../model/entities/segment'

export interface SegmentRepository {
  getSegment(segmentId: string): Promise<Segment>
  getSegments(rundownId: string): Promise<Segment[]>
  saveSegment(segment: Segment): Promise<void>
  delete(segmentId: string): Promise<void>
  deleteSegmentsForRundown(rundownId: string): Promise<void>
  deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void>
  deleteAllUnsyncedSegments(): Promise<void>
}
