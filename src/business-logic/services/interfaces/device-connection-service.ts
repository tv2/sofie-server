import { Device } from '../../../model/entities/device'
import { DeviceConnectionStatus } from '../../../model/enums/device-connection-status'
import { DeviceType } from '../../../model/enums/device-type'

export interface DeviceConnectionService {
  createConnection(device: Device): Promise<void>
  getConnectionStatusById(deviceId: string): DeviceConnectionStatus
  disconnectConnectionById(deviceId: string): Promise<void>
  removeConnectionById(deviceId: string): Promise<void>
  connectionExists(deviceType: DeviceType): boolean
  getConnectedDevices(): Device[]
  send(deviceId: string, params: string[]): Promise<void>
  listen(deviceId: string, callback: (data: unknown) => void): Promise<void>
}
