import {DeviceService} from './interfaces/device-service'
import {Device} from '../../model/entities/device'
import {DeviceRepository} from '../../data-access/repositories/interfaces/device-repository'
import {DeviceEventEmitter} from './interfaces/device-event-emitter'

export class DeviceServiceImplementation implements DeviceService {
  constructor(private readonly deviceRepository: DeviceRepository, private readonly deviceEventEmitter: DeviceEventEmitter) {
  }

  public async getDevices(): Promise<Device[]> {
    return await this.deviceRepository.getDevices()
  }

  public async getDevice(deviceId: string): Promise<Device> {
    const deviceConfig = await this.deviceRepository.getDevice(deviceId)
    if (!deviceConfig) {
      throw new Error(`Device with id ${deviceId} not found`)
    }
    return deviceConfig
  }

  public async create(device: Device): Promise<void> {
    await this.deviceRepository.save(device)
    this.deviceEventEmitter.emitDeviceCreatedEvent(device)
  }

  public async update(device: Device): Promise<void> {
    await this.deviceRepository.update(device)
    this.deviceEventEmitter.emitDeviceUpdatedEvent(device)
  }
}