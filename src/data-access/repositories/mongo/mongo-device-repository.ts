/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseMongoRepository } from './base-mongo-repository'
import { DeviceRepository } from '../interfaces/device-repository'
import { Device } from '../../../model/entities/device'
import { MongoDatabase } from './mongo-database'

const DEVICE_COLLECTION_NAME: string = 'externalDevices'

export class MongoDeviceRepository extends BaseMongoRepository implements DeviceRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async findAllDevices(): Promise<Device[]> {
    throw new Error('NOT IMPLEMENTED')
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  public async findById(_deviceId: string): Promise<Device> {
    throw new Error('NOT IMPLEMENTED')
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  public async create(_device: Device): Promise<Device[]> {
    throw new Error('NOT IMPLEMENTED')
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  public async update(_deviceId: string, _device: Device): Promise<Device[]> {
    throw new Error('NOT IMPLEMENTED')
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  public async delete(_deviceId: string): Promise<Device[]> {
    throw new Error('NOT IMPLEMENTED')
  }
}
