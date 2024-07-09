import { Device } from '../../../model/entities/device'

export interface DeviceRepository {
  findAllDevices(): Promise<Device[]>
}
