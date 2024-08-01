import { Device } from '../../../model/entities/device'
import { DeviceConnection } from './device-connection'

export interface DeviceConnectionFactory {
  createDeviceConnection(device: Device): DeviceConnection | undefined
}