import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { MongoDevice, MongoEntityConverter } from './mongo-entity-converter'
import { DeviceRepository } from '../interfaces/device-repository'
import { Device } from '../../../model/entities/device'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoCoreDeviceRepository extends BaseMongoRepository implements DeviceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  public getDevice(_deviceId: string): Promise<Device> {
    throw new UnsupportedOperationException(this.getDevice.name)
  }

  public save(_device: Device): Promise<void> {
    throw new UnsupportedOperationException(this.save.name)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDevices(): Promise<Device[]> {
    this.assertDatabaseConnection(MongoCoreDeviceRepository.prototype.getDevices.name)
    const mongoDevices: MongoDevice[] = await this.getCollection().find<MongoDevice>({}).toArray()
    return this.mongoEntityConverter.convertToDeviceInterfaces(mongoDevices)
  }
}
