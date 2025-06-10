import { TimelineObject } from '../../../rundown-execution/domain/entities/timeline-object'
import { DeviceType } from '../../../rundown-execution/domain/enums/device-type'
import { TimelineObjectMetadata } from '../../../rundown-execution/domain/value-objects/metadata'

export interface Tv2BlueprintTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType
    type: unknown
  }
  metaData?: TimelineObjectMetadata
  isLookahead?: boolean
  lookaheadForLayer?: string
}
