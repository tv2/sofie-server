import { DeviceService } from './interfaces/device-service'
import { Device } from '../../model/entities/device'
import { DeviceRepository } from '../../data-access/repositories/interfaces/device-repository'
import { DeviceEventEmitter } from './interfaces/device-event-emitter'

export class DeviceServiceImplementation implements DeviceService {
  constructor(
    private readonly deviceRepository: DeviceRepository, 
    private readonly deviceEventEmitter: DeviceEventEmitter
  ) {
  }

  public async getDevices(): Promise<Device[]> {
    return this.deviceRepository.getDevices()
  }

  public async getDevice(deviceId: string): Promise<Device> {
    return this.deviceRepository.getDevice(deviceId)
  }

  public async create(device: Device): Promise<void> {
    await this.deviceRepository.save(device)
    this.deviceEventEmitter.emitDeviceCreatedEvent(device)
  }

  public async update(device: Device): Promise<void> {
    await this.deviceRepository.update(device)
    this.deviceEventEmitter.emitDeviceUpdatedEvent(device)
  }

  public async delete(deviceId: string): Promise<void> {
    await this.deviceRepository.delete(deviceId)
    this.deviceEventEmitter.emitDeviceDeletedEvent(deviceId)
  }

  public reconnect(deviceId: string): void {
    this.deviceEventEmitter.emitDeviceReconnectingEvent(deviceId)
  }
}