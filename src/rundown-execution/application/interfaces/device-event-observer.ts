import { DeviceEvent } from '../value-objects/device-event'

export interface DeviceEventObserver {
  subscribeToDeviceEvents(onDeviceEventCallback: (deviceEvent: DeviceEvent) => void): void
}
