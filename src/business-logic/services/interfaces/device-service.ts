import {Device} from '../../../model/entities/device'

export interface DeviceService {
  getDevices(): Promise<Device[]>

  getDevice(deviceId: string): Promise<Device>

  create(device: Device): Promise<void>
}