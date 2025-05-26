import { DeviceService } from './interfaces/device-service'
import { DeviceConfiguration } from '../../model/entities/device-configuration'
import {
  DeviceConfigurationRepository
} from '../../data-access/repositories/interfaces/device-configuration-repository'
import { DeviceEventEmitter } from './interfaces/device-event-emitter'
import { DeviceFactory } from './device-factory'
import { Device } from '../../model/entities/devices/device'
import { NotFoundException } from '../../model/exceptions/not-found-exception'

export class DeviceManager implements DeviceService {

  private static instance: DeviceService

  public static getInstance(
    deviceConfigurationRepository: DeviceConfigurationRepository,
    deviceEventEmitter: DeviceEventEmitter,
    deviceFactory: DeviceFactory
  ): DeviceService {
    if (!this.instance) {
      this.instance = new DeviceManager(deviceConfigurationRepository, deviceEventEmitter, deviceFactory)
    }
    return this.instance
  }

  private readonly devices: Device[] = []

  constructor(
    private readonly deviceConfigurationRepository: DeviceConfigurationRepository,
    private readonly deviceEventEmitter: DeviceEventEmitter,
    private readonly deviceFactory: DeviceFactory
  ) {
  }

  public async initialize(): Promise<void> {
    const deviceConfigurations: DeviceConfiguration[] = await this.deviceConfigurationRepository.getDeviceConfigurations()
    deviceConfigurations.forEach(deviceConfiguration => {
      const device: Device = this.createDevice(deviceConfiguration)
      device.connect()
    })
  }

  private createDevice(deviceConfiguration: DeviceConfiguration): Device {
    const device: Device = this.deviceFactory.createDevice(deviceConfiguration, (device: Device) => this.deviceEventEmitter.emitDeviceUpdatedEvent(device))
    this.devices.push(device)
    return device
  }

  public getDevices(): Device[] {
    return this.devices
  }

  public getDevice(deviceId: string): Device {
    const device: Device | undefined = this.devices.find(device => device.getId() === deviceId)
    if (!device) {
      throw new NotFoundException(`Unable to find Device for id: ${deviceId}`)
    }
    return device
  }

  public async create(deviceConfiguration: DeviceConfiguration): Promise<void> {
    const createdDeviceConfiguration: DeviceConfiguration = await this.deviceConfigurationRepository.create(deviceConfiguration)
    const device: Device = this.createDevice(createdDeviceConfiguration)
    this.deviceEventEmitter.emitDeviceCreatedEvent(device)
    device.connect()
  }

  public async update(deviceConfiguration: DeviceConfiguration): Promise<void> {
    await this.deviceConfigurationRepository.update(deviceConfiguration)
    this.disconnectedAndRemoveDevice(deviceConfiguration.id)
    const device: Device = this.createDevice(deviceConfiguration)
    this.deviceEventEmitter.emitDeviceUpdatedEvent(device)
    device.connect()
  }

  private disconnectedAndRemoveDevice(deviceConfigurationId: string): void {
    const deviceIndex: number = this.devices.findIndex(device => device.getId() === deviceConfigurationId)
    if (deviceIndex === -1) {
      return
    }
    // This should always return an array with exactly one entry.
    const deletedDevices: Device[] = this.devices.splice(deviceIndex, 1)
    deletedDevices[0].disconnect()
  }

  public async delete(deviceConfigurationId: string): Promise<void> {
    this.disconnectedAndRemoveDevice(deviceConfigurationId)

    await this.deviceConfigurationRepository.delete(deviceConfigurationId)
    this.deviceEventEmitter.emitDeviceDeletedEvent(deviceConfigurationId)
  }

  public reconnect(deviceConfigurationId: string): void {
    const device: Device | undefined = this.devices.find(device => device.getId() === deviceConfigurationId)
    if (!device) {
      throw new NotFoundException(`Unable to reconnect to Device. No Device found for ${deviceConfigurationId}`)
    }
    device.disconnect()
    device.connect()
  }
}
