import { Device } from '../../../model/entities/device'
import { INewsDevice } from '../../../model/entities/inews-device'
import { TelemetricsDevice } from '../../../model/entities/telemetrics-device'

export interface DeviceService {
  readAllDeviceConfigurations(): Promise<(Device | INewsDevice | TelemetricsDevice)[]>
  readConfiguration(deviceId: string): Promise<Device | INewsDevice | TelemetricsDevice>
  create(config: Device | INewsDevice | TelemetricsDevice): Promise<void>
  update(deviceId: string, config: Device): Promise<void>
  delete(deviceId: string): Promise<void>
  disconnect(deviceId: string): Promise<void>
  connect(deviceId: string): Promise<void>
  connectAll(): Promise<void>
}