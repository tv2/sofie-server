import { Device } from '../../../model/entities/device'

export interface DeviceService {
  readAllConfigurations(): Promise<Device[]>
  readConfiguration(deviceId: string): Promise<Device>
  create(config: Device): Promise<void>
  update(deviceId: string, config: Device): Promise<void>
  delete(deviceId: string): Promise<void>
  disconnect(deviceId: string): Promise<void>
  connect(deviceId: string): Promise<void>
  connectAll(): Promise<void>
}