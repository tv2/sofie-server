import { TimelineObject as SuperFlyTimelineObject } from 'superfly-timeline'
import { TimelineEnable } from './timeline-enable'
import { Tv2TimelineObjectMetadata } from '../../blueprints/tv2/value-objects/tv2-metadata'

export type TimelineObject = SuperFlyTimelineObject & {
  enable: TimelineEnable
  layer: string
  inGroup?: string
  children?: TimelineObject[]
  metaData?: Tv2TimelineObjectMetadata
  content: unknown
}

export interface LookaheadTimelineObject extends TimelineObject {
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
