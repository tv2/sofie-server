import {Device} from '../../model/entities/device'
import {DeviceCreatedEvent, DeviceDeletedEvent, DeviceReconnectingEvent, DeviceUpdatedEvent} from '../value-objects/device-event'

export interface DeviceEventBuilder {
  buildDeviceCreatedEvent(device: Device): DeviceCreatedEvent

  buildDeviceUpdatedEvent(device: Device): DeviceUpdatedEvent

  buildDeviceDeletedEvent(deviceId: string): DeviceDeletedEvent

  buildDeviceReconnectingEvent(deviceId: string): DeviceReconnectingEvent
}
