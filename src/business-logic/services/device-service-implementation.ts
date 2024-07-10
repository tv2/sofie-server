import { DeviceService } from './interfaces/device-service'
import { Device } from '../../model/entities/device'
import { DeviceRepository } from '../../data-access/repositories/interfaces/device-repository'

export class DeviceServiceImplementation implements DeviceService {
  constructor(private readonly deviceRepository: DeviceRepository) {}
  
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
    // TODO: Implement emit DeviceCreatedEvent
    // const existingDevice = await this.deviceRepository.findById(device.id)
    // if (existingDevice) {
    //   throw new Error(`Device with id ${device.id} already exists`)
    // }
    await this.deviceRepository.save(device)
  }
}
