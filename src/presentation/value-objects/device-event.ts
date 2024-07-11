import { DeviceDtoInterface } from '../dtos/device-dto'
import { DeviceEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'

export type DeviceEvent = DeviceCreatedEvent

export interface DeviceCreatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_CREATED
  device: DeviceDtoInterface
}
