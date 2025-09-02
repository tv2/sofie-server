import { Timeline } from '../entities/timeline'

export interface TimelineRepository {
  getTimeline(): Promise<Timeline>
  saveTimeline(timeline: Timeline): Promise<void>
}
