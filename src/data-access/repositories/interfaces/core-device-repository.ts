import { CoreDevice } from '../../../model/entities/core-device'

export interface CoreDeviceRepository {
  getDevices(): Promise<CoreDevice[]>
}
