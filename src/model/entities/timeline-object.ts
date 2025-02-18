import { TimelineObject as SuperFlyTimelineObject } from 'superfly-timeline'
import { TimelineEnable } from './timeline-enable'
import { TimelineObjectMetadata } from '../value-objects/metadata'
import { DeviceType } from '../enums/device-type'

export type TimelineObject = SuperFlyTimelineObject & {
  enable: TimelineEnable
  layer: string
  inGroup?: string
  children?: TimelineObject[]
  metaData?: TimelineObjectMetadata // TODO: Remove optional?
  content: {
    deviceType: DeviceType
    type: unknown
  }
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
