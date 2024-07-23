import { DeviceConnection, DeviceConnectionService } from './interfaces/device-connection-service'
import { Device } from '../../model/entities/device'
import { DeviceConnectionFactory } from './interfaces/device-connection-factory'

export class DeviceConnectionServiceImplementation implements DeviceConnectionService {
  private connectedDevices: {  
    [deviceId: string]: DeviceConnection  
  } = {} 

  constructor(private readonly deviceConnectionFactory: DeviceConnectionFactory) {
  }

  public async createConnection(device: Device): Promise<DeviceConnectionStatus> {
    if (device.id in this.connectedDevices) throw new DeviceAlreadyConnectedError(device.id)
    const deviceConnection: DeviceConnection = this.deviceConnectionFactory.createDeviceConnection(device)
    
    await deviceConnection.connect()
    this.connectedDevices[device.id] = deviceConnection
    
    return DeviceConnectionStatus.CONNECTED
  }

  public getConnectionStatusById(_deviceId: string): DeviceConnectionStatus {
    return _deviceId in this.connectedDevices ? DeviceConnectionStatus.CONNECTED : DeviceConnectionStatus.DISCONNECTED  
  }

  public async removeConnectionById(deviceId: string): Promise<DeviceConnectionStatus> {
    if(!(deviceId in this.connectedDevices)) throw new DeviceAlreadyRemovedError(deviceId)
    
    await this.connectedDevices[deviceId].disconnect()
    this.connectedDevices[deviceId]
    const { [deviceId]: _, ...remainingDevices } = this.connectedDevices
    this.connectedDevices = remainingDevices

    return DeviceConnectionStatus.DISCONNECTED
  }

  public connectionExists(deviceId: string): boolean {
    return deviceId in this.connectedDevices
  }

  public listAllConnectionIds(): string[] {
    const ids: string[] = []
    Object.entries(this.connectedDevices).forEach(([deviceId, _deviceConnection]) => {
      ids.push(deviceId)
    })
    return ids
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