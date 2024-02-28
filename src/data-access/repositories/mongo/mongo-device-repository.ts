import { BaseMongoRepository } from './base-mongo-repository'
import { DeviceRepository } from '../interfaces/device-repository'
import { Device } from '../../../model/entities/device'
import { MongoDatabase } from './mongo-database'
import { MongoDevice, MongoEntityConverter } from './mongo-entity-converter'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoDeviceRepository extends BaseMongoRepository implements DeviceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDevices(): Promise<Device[]> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.getDevices.name)
    const mongoDevices: MongoDevice[] = await this.getCollection().find<MongoDevice>({}).toArray()
    return this.mongoEntityConverter.convertToDevices(mongoDevices)
  }
}
