import { Device } from '../../../model/entities/device'
import { DeviceConnectionStatus } from '../../../model/enums/device-connection-status'

export interface DeviceConnectionService {
  createConnection(device: Device): Promise<DeviceConnectionStatus>
  getConnectionStatusById(deviceId: string): DeviceConnectionStatus
  disconnectConnectionById(deviceId: string): Promise<DeviceConnectionStatus>
  removeConnectionById(deviceId: string): Promise<DeviceConnectionStatus>
  connectionExists(deviceId: string): boolean
  getConnectedDevices(): Device[]
  send(deviceId: string, params: string[]): Promise<void>
  listen(deviceId: string, callback: (data: unknown) => void): Promise<void>
}
