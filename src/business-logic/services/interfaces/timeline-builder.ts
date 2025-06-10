import { Rundown } from '../../../rundown-execution/domain/entities/rundown'
import { Timeline } from '../../../rundown-execution/domain/entities/timeline'
import { Studio } from '../../../rundown-execution/domain/entities/studio'

export interface TimelineBuilder {
  getBaseTimeline(): Timeline
  buildTimeline(rundown: Rundown, studio?: Studio): Promise<Timeline>
}
