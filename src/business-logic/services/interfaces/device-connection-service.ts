import { Device } from '../../../model/entities/device'
import { DeviceConnectionStatus } from '../device-connection-service-implementation'

export interface DeviceConnectionService<TParams> {
  createConnection(device: Device): Promise<DeviceConnectionStatus>
  getConnectionStatusById(deviceId: string): DeviceConnectionStatus
  disconnectConnectionById(deviceId: string): Promise<DeviceConnectionStatus>
  removeConnectionById(deviceId: string): Promise<DeviceConnectionStatus>
  connectionExists(deviceId: string): boolean
  listAllNetworkedDevices(): Device[]
  send(deviceId: string, params: TParams): Promise<void>
  listen(deviceId: string, callback: (data: unknown) => void): Promise<void>
}
