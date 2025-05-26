import {DeviceConfiguration} from '../../../model/entities/device-configuration'
import { Device } from '../../../model/entities/devices/device'

export interface DeviceService {
  initialize(): Promise<void>
  getDevice(deviceId: string): Device
  getDevices(): Device[]
  create(deviceConfiguration: DeviceConfiguration): Promise<void>
  update(deviceConfiguration: DeviceConfiguration): Promise<void>
  delete(deviceConfigurationId: string): Promise<void>
  reconnect(deviceConfigurationId: string): void
}
