import { DeviceType } from '../../../../rundown-execution/domain/enums/device-type'
import { TimelineObject } from '../../../../rundown-execution/domain/entities/timeline-object'

export interface EmptyTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ABSTRACT
    type: 'empty'
  }
}
