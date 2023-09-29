import { Segment } from '../../../model/entities/segment'

export interface SegmentRepository {
  getSegment(segmentId: string): Promise<Segment>
  getSegments(rundownId: string): Promise<Segment[]>
  saveSegment(segment: Segment): Promise<void>
  deleteSegmentsForRundown(rundownId: string): Promise<void>
}
