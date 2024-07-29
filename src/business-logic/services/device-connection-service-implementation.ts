import { DeviceConnectionService } from './interfaces/device-connection-service'
import { Device } from '../../model/entities/device'
import { DeviceConnectionFactory } from './interfaces/device-connection-factory'
import { DeviceConnection } from './interfaces/device-connection'
import { DeviceConnectionStatus } from '../../model/enums/device-connection-status'

type DeviceAggregate = {
  deviceConnection: DeviceConnection,
  device: Device
}

export class DeviceConnectionServiceImplementation implements DeviceConnectionService {
  private readonly connectedDevices: Map<string, DeviceAggregate> = new Map()

  constructor(private readonly deviceConnectionFactory: DeviceConnectionFactory) {
  }

  public async createConnection(device: Device): Promise<DeviceConnectionStatus> {
    if (this.connectedDevices.has(device.id)) {
      throw new DeviceAlreadyConnectedError(device.id)
    }
    const deviceConnection: DeviceConnection = this.deviceConnectionFactory.createDeviceConnection(device)

    await deviceConnection.connect()

    this.connectedDevices.set(device.id, {deviceConnection, device})

    return DeviceConnectionStatus.CONNECTED
  }

  public async send(deviceId: string, params: string[]): Promise<void> {
    const connectedDevice: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if(connectedDevice === undefined) {
      throw new DeviceNotFoundError(deviceId)
    }

    await connectedDevice.deviceConnection.send(deviceId, params)
  }

  public async listen(deviceId: string, _callback: (data: unknown) => void): Promise<void> {
    const connectedDevice: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if(connectedDevice === undefined){
      throw new DeviceNotFoundError(deviceId)
    }

    await connectedDevice.deviceConnection.listen(deviceId, _callback)
  }

  public getConnectionStatusById(deviceId: string): DeviceConnectionStatus {
    // we don't do thorough testing of both actual connection and the isConnected field since isConnected is an inheritance from CoreDevice and not needed here.
    return this.connectedDevices.has(deviceId) ? DeviceConnectionStatus.CONNECTED : DeviceConnectionStatus.DISCONNECTED 
  }

  public async disconnectConnectionById(deviceId: string): Promise<DeviceConnectionStatus> {
    await this.connectedDevices.get(deviceId)?.deviceConnection.disconnect()
    return DeviceConnectionStatus.DISCONNECTED
  }

  public async removeConnectionById(deviceId: string): Promise<DeviceConnectionStatus> {
    const device: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if (!device?.deviceConnection) {
      throw new DeviceAlreadyRemovedError(deviceId)
    }

    await device.deviceConnection.disconnect()

    this.connectedDevices.delete(deviceId)

    return DeviceConnectionStatus.DISCONNECTED
  }

  public connectionExists(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId)
  }

  public getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values()).map(deviceAggregate => deviceAggregate.device)
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

class DeviceNotFoundError extends Error {
  constructor(deviceId: string) {
    super(`Device with ID '${deviceId}' is not in the collection. Have you forgot to create the connection?`)
    this.name = 'DeviceAlreadyRemovedError'
  }
}

