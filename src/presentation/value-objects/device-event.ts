import { DeviceDtoInterface } from '../dtos/device-dto'
import { DeviceEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'

export type DeviceEvent = DeviceCreatedEvent | DeviceUpdatedEvent | DeviceDeletedEvent

export interface DeviceIdEvent extends TypedEvent {
  type: DeviceEventType,
  deviceId: string
}

export interface DeviceCreatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_CREATED
  device: DeviceDtoInterface
}

export interface DeviceUpdatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_UPDATED
  device: DeviceDtoInterface
}

export interface DeviceDeletedEvent extends DeviceIdEvent {
  type: DeviceEventType.DEVICE_DELETED
  deviceId: string
}
