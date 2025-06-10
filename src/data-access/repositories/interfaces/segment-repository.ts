import { Segment } from '../../../rundown-execution/domain/entities/segment'

export interface SegmentRepository {
  getSegment(segmentId: string): Promise<Segment>
}
