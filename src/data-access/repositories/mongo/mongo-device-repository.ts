/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseMongoRepository } from './base-mongo-repository'
import { DeviceRepository } from '../interfaces/device-repository'
import { Device } from '../../../model/entities/device'
import { MongoDatabase } from './mongo-database'
import { UuidGenerator } from '../interfaces/uuid-generator'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'


const DEVICE_COLLECTION_NAME: string = 'externalDevices'

export class MongoDeviceRepository extends BaseMongoRepository implements DeviceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDevices(): Promise<Device[]> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.getDevices.name)
    return await this.getCollection().find<Device>({}).toArray()
  }

  public async getDevice(deviceId: string): Promise<Device> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.getDevice.name)
    const device: Device | null = await this.getCollection().findOne<Device>({id: deviceId})
    if (!device) {
      throw new NotFoundException(`Unable to find device with id '${deviceId}'.`)
    }
    return device
  }

  public async save(device: Device): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.save.name)
    let pureDevice: Device = {} as Device
    if (!device.id) {
      pureDevice = {
        ...device,
        id: this.uuidGenerator.generateUuid(),
      }
    }

    await this.getCollection().updateOne({id: pureDevice.id}, {$set: pureDevice}, {upsert: true})
  }

  public async update(device: Device): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.update.name)
    await this.getCollection().updateOne({id: device.id}, {$set: device}, {upsert: true})
  }

  public async delete(deviceId: string): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.delete.name)
    await this.getCollection().deleteOne({id: deviceId})
  }
}