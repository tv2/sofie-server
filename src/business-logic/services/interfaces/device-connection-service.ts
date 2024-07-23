import { Device } from '../../../model/entities/device'
import { DeviceConnectionStatus } from '../device-connection-service-implementation'

export interface DeviceConnectionService {
  createConnection(device: Device): Promise<DeviceConnectionStatus>
  getConnectionStatusById(deviceId: string): DeviceConnectionStatus
  disconnectConnectionById(deviceId: string): Promise<DeviceConnectionStatus>
  removeConnectionById(deviceId: string): Promise<DeviceConnectionStatus>
  connectionExists(deviceId: string): boolean
  listAllNetworkedDevices(): Device[]
}

export interface DeviceConnection {
  connect(): Promise<boolean>
  disconnect(): Promise<boolean>
}

export class TelemetriceDeviceConnection implements DeviceConnection {
  private readonly device: Device
  constructor(_device: Device) { this.device = _device}
  
  public connect(): Promise<boolean> {
    this.device.isConnected = true

    throw new Error('Method not implemented.')
  }

  public disconnect(): Promise<boolean> {
    this.device.isConnected = false

    throw new Error('Method not implemented.')
  }
}

export class INewsGatewayDeviceConnection implements DeviceConnection {
  private readonly device: Device
  constructor(_device: Device) { this.device = _device }

  public connect(): Promise<boolean> {
    // insert guard clause here, in case device is already (dis)connecting
    this.device.isConnected = true

    throw new Error('Method not implemented.')
  }

  public disconnect(): Promise<boolean> {
    // insert guard clause here, in case device is already (dis)connecting
    this.device.isConnected = false

    throw new Error('Method not implemented.')
  }
}