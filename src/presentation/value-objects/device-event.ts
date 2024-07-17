import { DeviceEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'
import { Device } from '../../model/entities/device'

export type DeviceEvent = DeviceCreatedEvent

export interface DeviceCreatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_CREATED
  device: Device
}