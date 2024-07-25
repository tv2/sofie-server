import { Device } from '../../../model/entities/device'
import { DeviceConnection } from './inewsgateway-device-connection'

export interface DeviceConnectionFactory {
  createDeviceConnection<TParams>(device: Device): DeviceConnection<TParams>
}