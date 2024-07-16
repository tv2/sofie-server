import { Device } from '../../model/entities/device'
import { DeviceCreatedEvent } from '../value-objects/device-event'

export interface DeviceEventBuilder {
  buildDeviceCreatedEvent(device: Device): DeviceCreatedEvent
}
