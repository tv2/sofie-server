import { Device } from '../../../model/entities/device'

export interface DeviceEventEmitter {
  emitDeviceCreatedEvent(device: Device): void
}