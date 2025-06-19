import { TimelineObject as SuperFlyTimelineObject } from 'superfly-timeline'
import { TimelineEnable } from './timeline-enable'
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

export interface TimelineObjectMetadata {
  context?: string
  mediaPlayerSession?: string
  templateData?: unknown
  fileName?: string
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
