import { Rundown } from '../entities/rundown'
import { Timeline } from '../entities/timeline'
import { Studio } from '../entities/studio'

export interface TimelineBuilder {
  getBaseTimeline(): Timeline
  buildTimeline(rundown: Rundown, studio?: Studio): Promise<Timeline>
}
