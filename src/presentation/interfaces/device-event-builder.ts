import {Device} from '../../model/entities/device'
import {DeviceCreatedEvent, DeviceDeletedEvent, DeviceUpdatedEvent} from '../value-objects/device-event'

export interface DeviceEventBuilder {
  buildDeviceCreatedEvent(device: Device): DeviceCreatedEvent

  buildDeviceUpdatedEvent(device: Device): DeviceUpdatedEvent

  buildDeviceDeletedEvent(deviceId: string): DeviceDeletedEvent
}
