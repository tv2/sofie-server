import { Device } from './device'
import { DeviceConnection } from '../../business-logic/services/interfaces/device-connection'

export type DeviceAggregate = {
  deviceConnection: DeviceConnection
  device: Device
}
