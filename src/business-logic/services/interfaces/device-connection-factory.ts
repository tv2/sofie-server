import { Device } from '../../../model/entities/device'
import { DeviceConnection } from './device-connection-service'

export interface DeviceConnectionFactory {
  createDeviceConnection(device: Device): DeviceConnection
}