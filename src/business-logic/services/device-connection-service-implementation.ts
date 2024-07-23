import { DeviceConnection, DeviceConnectionService } from './interfaces/device-connection-service'
import { Device } from '../../model/entities/device'
import { DeviceConnectionFactory } from './interfaces/device-connection-factory'

type DeviceAggregate = {
  deviceConnection: DeviceConnection,
  device: Device
}

export class DeviceConnectionServiceImplementation implements DeviceConnectionService {
  private readonly connectedDevices: Map<string, DeviceAggregate> = new Map()

  constructor(private readonly deviceConnectionFactory: DeviceConnectionFactory) {
  }

  public async createConnection(device: Device): Promise<DeviceConnectionStatus> {
    if (this.connectedDevices.has(device.id)) throw new DeviceAlreadyConnectedError(device.id)
    const deviceConnection: DeviceConnection = this.deviceConnectionFactory.createDeviceConnection(device)
    
    await deviceConnection.connect()
    
    this.connectedDevices.set(device.id, { deviceConnection, device })

    return DeviceConnectionStatus.CONNECTED
  }

  public getConnectionStatusById(deviceId: string): DeviceConnectionStatus {
    return this.connectedDevices.has(deviceId) ? DeviceConnectionStatus.CONNECTED : DeviceConnectionStatus.DISCONNECTED  
  }

  public async disconnectConnectionById(deviceId: string): Promise<DeviceConnectionStatus> {
    await this.connectedDevices.get(deviceId)?.deviceConnection.disconnect()
    return DeviceConnectionStatus.DISCONNECTED
  }

  public async removeConnectionById(deviceId: string): Promise<DeviceConnectionStatus> {
    const device: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if(! device?.deviceConnection) throw new DeviceAlreadyRemovedError(deviceId)
    
    await device.deviceConnection.disconnect()
    
    this.connectedDevices.delete(deviceId)

    return DeviceConnectionStatus.DISCONNECTED
  }

  public connectionExists(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId)
  }

  public listAllNetworkedDevices(): Device[] {
    const networkedDevices: Device[] = []
    this.connectedDevices.forEach((deviceAggregate, _key) => {
      networkedDevices.push(deviceAggregate.device)
    })
    return networkedDevices
  }
}

class DeviceAlreadyConnectedError extends Error {
  constructor(deviceId: string) {
    super(`Device with ID '${deviceId}' is already connected.`)
    this.name = 'DeviceAlreadyConnectedError'
  }
}

class DeviceAlreadyRemovedError extends Error {
  constructor(deviceId: string) {
    super(`Device with ID '${deviceId}' is already removed.`)
    this.name = 'DeviceAlreadyRemovedError'
  }
}

export enum DeviceConnectionStatus {
  DISCONNECTED = 0,
  CONNECTED = 1
}