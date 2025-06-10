import { CoreDevice } from '../../../rundown-execution/domain/entities/device'

export interface DeviceRepository {
  getDevices(): Promise<CoreDevice[]>
}
