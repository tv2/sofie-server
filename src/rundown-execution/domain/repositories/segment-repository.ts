import { Segment } from '../entities/segment'

export interface SegmentRepository {
  getSegment(segmentId: string): Promise<Segment>
}
