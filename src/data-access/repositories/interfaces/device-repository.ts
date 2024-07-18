import { Device } from '../../../model/entities/device'

export interface DeviceRepository {
  getDevices(): Promise<Device[]>
  getDevice(deviceId: string): Promise<Device>
  save(device: Device): Promise<void>
  update(device: Device): Promise<void>
  delete(deviceId: string): Promise<void>
}
