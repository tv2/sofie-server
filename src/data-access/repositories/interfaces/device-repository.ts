import { Device } from '../../../model/entities/device'

export interface DeviceRepository {
  getDevices(): Promise<Device[]>
}
