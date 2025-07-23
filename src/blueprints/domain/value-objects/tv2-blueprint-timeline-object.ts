import { TimelineObject, TimelineObjectMetadata } from '../../../rundown-execution/domain/entities/timeline-object'
import { DeviceType } from '../../../sofie-ingest/domain/enums/device-type'

export interface Tv2BlueprintTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType
    type: unknown
  }
  metaData?: TimelineObjectMetadata
  isLookahead?: boolean
  lookaheadForLayer?: string
}
