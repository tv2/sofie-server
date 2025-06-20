import { TimelineObject, TimelineObjectMetadata } from '../../../rundown-execution/domain/entities/timeline-object'
import { DeviceType } from '../../../rundown-execution/domain/enums/device-type'

export interface Tv2BlueprintTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType
    type: unknown
  }
  metaData?: TimelineObjectMetadata
  isLookahead?: boolean
  lookaheadForLayer?: string
}
