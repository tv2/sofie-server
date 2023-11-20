import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

export interface EmptyTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ABSTRACT,
    type: 'empty'
  }
}
