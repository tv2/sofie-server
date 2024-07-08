/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseMongoRepository } from './base-mongo-repository'
import { DeviceRepository } from '../interfaces/device-repository'
import { Device } from '../../../model/entities/device'
import { MongoDatabase } from './mongo-database'
import { INewsDevice } from '../../../model/entities/inews-device'
import { TelemetricsDevice } from '../../../model/entities/telemetrics-device'

const DEVICE_COLLECTION_NAME: string = 'externalDevices'

export class MongoDeviceRepository extends BaseMongoRepository implements DeviceRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async findAllDevices(): Promise<(Device | INewsDevice | TelemetricsDevice)[]> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.findAllDevices.name)
    const devices: Device[] = await this.getCollection().find<(Device | INewsDevice | TelemetricsDevice)>({}).toArray() 
    return devices
  }

  public async findById(_deviceId: string): Promise<Device | null> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.findById.name)
    try {
      const device = await this.getCollection().findOne<(Device | INewsDevice | TelemetricsDevice)>({ _id: _deviceId })
      return device
    } catch (error) {
      console.error(`Error finding device by id ${_deviceId}:`, error)
      return null
    }
  }

  public async create(_device: Device | INewsDevice | TelemetricsDevice): Promise<void> {
    try{
      this.assertDatabaseConnection(MongoDeviceRepository.prototype.create.name)
      // const result: InsertOneResult<unknown> = 
      await this.getCollection().insertOne(_device)
    } catch (error) {
      console.error(`Error creating new device by id ${_device.id}:`, error)
    }
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
