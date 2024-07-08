import { DeviceService } from './interfaces/device-service'
import { MongoDeviceRepository } from '../../data-access/repositories/mongo/mongo-device-repository'
import { Device } from '../../model/entities/device'

export class DeviceServiceImplementation implements DeviceService {
  constructor(private readonly deviceRepository: MongoDeviceRepository) {}
  
  public async readAllConfigurations(): Promise<Device[]> {
    return await this.deviceRepository.findAllDevices()
  }

  public async readConfiguration(deviceId: string): Promise<Device> {
    const deviceConfig = await this.deviceRepository.findById(deviceId)
    if (!deviceConfig) {
      throw new Error(`Device with id ${deviceId} not found`)
    }
    return deviceConfig
  }

  public async create(config: Device): Promise<void> {
    const existingDevice = await this.deviceRepository.findById(config.id)
    if (existingDevice) {
      throw new Error(`Device with id ${config.id} already exists`)
    }
    await this.deviceRepository.create(config)
  }

  public async update(deviceId: string, config: Device): Promise<void> {
    const existingDevice = await this.deviceRepository.findById(deviceId)
    if (!existingDevice) {
      throw new Error(`Device with id ${deviceId} not found`)
    }
    await this.deviceRepository.update(deviceId, config)
  }

  public async delete(deviceId: string): Promise<void> {
    const existingDevice = await this.deviceRepository.findById(deviceId)
    if (!existingDevice) {
      throw new Error(`Device with id ${deviceId} not found`)
    }
    await this.deviceRepository.delete(deviceId)
  }

  public async disconnect(deviceId: string): Promise<void> {
    const deviceConfig = await this.deviceRepository.findById(deviceId)
    if (!deviceConfig) {
      throw new Error(`Device with id ${deviceId} not found`)
    }
    // Simulate disconnecting the device
    console.log(`Disconnecting device ${deviceId}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  public async connect(deviceId: string): Promise<void> {
    const deviceConfig = await this.deviceRepository.findById(deviceId)
    if (!deviceConfig) {
      throw new Error(`Device with id ${deviceId} not found`)
    }
    // Simulate reconnecting the device
    console.log(`Connecting to device ${deviceId}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  
  public async connectAll(): Promise<void> {
    const devices = await this.deviceRepository.findAllDevices()

    if (!devices) {
      throw new Error('Devices not found')
    }

    devices.forEach(device => {
      device.connect()
    })
    // Simulate reconnecting the device
    console.log('Connecting to devices')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}
