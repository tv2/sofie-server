import { DeviceConnectionService } from './interfaces/device-connection-service'
import { Device } from '../../model/entities/device'
import { DeviceConnectionFactory } from './interfaces/device-connection-factory'
import { DeviceConnection } from './interfaces/device-connection'
import { DeviceConnectionStatus } from '../../model/enums/device-connection-status'
import { DeviceAlreadyConnectedException } from '../../model/exceptions/device-already-connected-exception'
import { DeviceNotFoundException } from '../../model/exceptions/device-not-found-exception'
import { Logger } from '@tv2media/logger/*'
import { DeviceService } from './interfaces/device-service'
import { DeviceType } from '../../model/enums/device-type'

type DeviceAggregate = {
  deviceConnection: DeviceConnection,
  device: Device
}

export class DeviceConnectionServiceImplementation implements DeviceConnectionService {
  private readonly connectedDevices: Map<string, DeviceAggregate> = new Map()

  constructor(private readonly deviceConnectionFactory: DeviceConnectionFactory, private readonly deviceService: DeviceService, private readonly logger: Logger) {
    this.initialize(this.deviceService)
      .then(() => {
        logger.debug('Initialization of DeviceConnectionService done')
      })
      .catch((error) => {
        logger.error(`Initialization of DeviceConnectionService failed with error: ${error}`)
      })
  }

  private async initialize(deviceService: DeviceService): Promise<void> {
    const devices: Device[] = await deviceService.getDevices()
    
    for (const device of devices) {
      if (!this.connectionExists(device.type)) {
        try {
          await this.createConnection(device)
        } catch(error) {
          this.logger.error(error)
        }
      }
    }
  }

  // Promise.all creates a race condition. Commented out until fixed.
  // private async initialize(deviceService: DeviceService): Promise<void> {
  //   const devices: Device[] = await deviceService.getDevices()
  //   await Promise.all(devices.map(async device => {
  //     if(!this.connectionExists(device.type)){
  //       await this.createConnection(device)
  //     }
  //   }))
  // }

  public async createConnection(device: Device): Promise<void> {
    if (this.connectedDevices.has(device.id)) {
      throw new DeviceAlreadyConnectedException(device.id)
    }
    const deviceConnection: DeviceConnection | undefined = this.deviceConnectionFactory.createDeviceConnection(device)

    if(typeof deviceConnection === 'undefined'){
      this.logger.debug(`createConnection exited due to unsupported device ${device}`)
      return 
    }

    await deviceConnection.connect()

    this.connectedDevices.set(device.id, {deviceConnection, device})
    this.logger.info(`Device ${device.id} of type ${device.type} connected`)

    return
  }

  public async send(deviceId: string, params: string[]): Promise<void> {
    const connectedDevice: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if(connectedDevice === undefined) {
      throw new DeviceNotFoundException(deviceId)
    }

    await connectedDevice.deviceConnection.send(deviceId, params)
  }

  public async listen(deviceId: string, _callback: (data: unknown) => void): Promise<void> {
    const connectedDevice: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if(connectedDevice === undefined){
      throw new DeviceNotFoundException(deviceId)
    }

    await connectedDevice.deviceConnection.listen(deviceId, _callback)
  }

  public getConnectionStatusById(deviceId: string): DeviceConnectionStatus {
    // we don't do thorough testing of both actual connection and the isConnected field since isConnected is an inheritance from CoreDevice and not needed here.
    return this.connectedDevices.has(deviceId) ? DeviceConnectionStatus.CONNECTED : DeviceConnectionStatus.DISCONNECTED 
  }

  public async disconnectConnectionById(deviceId: string): Promise<void> {
    await this.connectedDevices.get(deviceId)?.deviceConnection.disconnect()
    this.logger.info(`Device ${deviceId} disconnected`)
    return
  }

  public async removeConnectionById(deviceId: string): Promise<void> {
    const device: DeviceAggregate | undefined = this.connectedDevices.get(deviceId)
    if (!device) {
      throw new DeviceNotFoundException(deviceId)
    }

    await device.deviceConnection.disconnect()
    this.logger.info(`Device ${deviceId} disconnected`)


    this.connectedDevices.delete(deviceId)
    this.logger.info(`Device ${deviceId} removed`)


    return
  }

  // Race conduition refactor
  // public connectionExists(deviceType: DeviceType): boolean {
  //   for (const value of this.connectedDevices.values()) {
  //     const device: Device = value.device
  //     if (device.type === deviceType) {
  //       return true
  //     }
  //   }
  //   return false  
  // }

  public connectionExists(deviceType: DeviceType): boolean {
    return Array.from(this.connectedDevices.values()).some(deviceAggregate => deviceAggregate.device.type === deviceType)
  }  

  public getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values()).map(deviceAggregate => deviceAggregate.device)
  }
}
