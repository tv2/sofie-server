import { Device } from '../../../model/entities/device'
import { INewsDevice } from '../../../model/entities/inews-device'
import { TelemetricsDevice } from '../../../model/entities/telemetrics-device'

export interface DeviceRepository {
  findAllDevices(): Promise<(Device | INewsDevice | TelemetricsDevice)[]>
}
