import { TimelineObject } from '../../../model/entities/timeline-object'
import { DeviceType } from '../../../model/enums/device-type'
import { TimelineObjectMetadata } from '../../../model/value-objects/metadata'

export interface Tv2BlueprintTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType
    type: unknown
  }
  metaData?: TimelineObjectMetadata
  isLookahead?: boolean
  lookaheadForLayer?: string
}
