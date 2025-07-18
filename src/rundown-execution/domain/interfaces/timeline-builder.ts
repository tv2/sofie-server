import { Rundown } from '../entities/rundown'
import { Timeline } from '../entities/timeline'
import { Configuration } from '../entities/configuration'

export interface TimelineBuilder {
  getBaseTimeline(configuration: Configuration): Timeline
  buildTimeline(rundown: Rundown, configuration: Configuration): Timeline
}
