import { TimelineObject as SuperFlyTimelineObject } from 'superfly-timeline'
import { TimelineEnable } from './timeline-enable'

export type TimelineObject = SuperFlyTimelineObject & {
  enable: TimelineEnable
  layer: string
  inGroup?: string
  children?: TimelineObject[]
  content: unknown
}

export interface LookAheadTimelineObject extends TimelineObject {
  isLookahead: boolean
  lookaheadForLayer?: string
}

export interface TimelineObjectGroup extends TimelineObject {
  isGroup: true
  children: TimelineObject[]
}

export interface ActivePartTimelineObjectGroup extends TimelineObjectGroup {
  autoNextEpochTime: number
}
