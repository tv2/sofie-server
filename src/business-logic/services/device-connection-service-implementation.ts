import { DeviceConnectionService } from './interfaces/device-connection-service'
import { Device } from '../../model/entities/device'
import { DeviceConnectionFactory } from './interfaces/device-connection-factory'
import { DeviceConnection } from './interfaces/inewsgateway-device-connection'

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

    this.connectedDevices.set(device.id, {deviceConnection, device})

    return DeviceConnectionStatus.CONNECTED
  }

  public async send(_deviceId: string, _params: string[]): Promise<void> {
    const conDevice: DeviceAggregate | undefined = this.connectedDevices.get(_deviceId)
    if(conDevice === undefined) throw new DeviceNotFoundError(_deviceId)

    await conDevice?.deviceConnection.send(_deviceId, _params)
  }

  public async listen(_deviceId: string, _callback: (data: unknown) => void): Promise<void> {
    const conDevice: DeviceAggregate | undefined = this.connectedDevices.get(_deviceId)
    if(conDevice === undefined) throw new DeviceNotFoundError(_deviceId)

    await conDevice?.deviceConnection.listen(_deviceId, _callback)
  }

  public getConnectionStatusById(deviceId: string): DeviceConnectionStatus {
    return this.connectedDevices.has(deviceId) ? (this.connectedDevices.get(deviceId)?.device.isConnected ? DeviceConnectionStatus.CONNECTED : DeviceConnectionStatus.DISCONNECTED) : DeviceConnectionStatus.DISCONNECTED
  }

  public async disconnectConnectionById(deviceId: string): Promise<DeviceConnectionStatus> {
    await this.connectedDevices.get(deviceId)?.deviceConnection.disconnect()
    return DeviceConnectionStatus.DISCONNECTED
  }

  public async removeConnectionById(deviceId: string): Promise<DeviceConnectionStatus> {
    const device: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if (!device?.deviceConnection) throw new DeviceAlreadyRemovedError(deviceId)

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

class DeviceNotFoundError extends Error {
  constructor(deviceId: string) {
    super(`Device with ID '${deviceId}' is not in the collection. Have you forgot to create the connection?`)
    this.name = 'DeviceAlreadyRemovedError'
  }
}

export enum DeviceConnectionStatus {
  DISCONNECTED = 0,
  CONNECTED = 1
}