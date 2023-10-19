import { TimelineObject } from '../../model/entities/timeline-object'
import { DeviceType } from '../../model/enums/device-type'

export interface EmptyTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ABSTRACT,
    type: 'empty'
  }
}