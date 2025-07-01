import { CoreDevice } from '../entities/device'

export interface DeviceRepository {
  getDevices(): Promise<CoreDevice[]>
}
