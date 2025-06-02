import { CoreDevice } from '../../../model/entities/device'

export interface DeviceRepository {
  getDevices(): Promise<CoreDevice[]>
}
