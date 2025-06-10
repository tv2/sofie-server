import { Timeline } from '../../../rundown-execution/domain/entities/timeline'

export interface TimelineRepository {
  getTimeline(): Promise<Timeline>
  saveTimeline(timeline: Timeline): Promise<void>
}
