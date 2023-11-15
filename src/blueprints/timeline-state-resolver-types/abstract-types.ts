import { DeviceType } from '../../model/enums/device-type'
import { Tv2BlueprintTimelineObject } from '../tv2/value-objects/tv2-metadata'

export interface EmptyTimelineObject extends Tv2BlueprintTimelineObject {
  content: {
    deviceType: DeviceType.ABSTRACT,
    type: 'empty'
  }
}
