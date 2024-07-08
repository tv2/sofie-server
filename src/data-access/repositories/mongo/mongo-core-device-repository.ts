import { BaseMongoRepository } from './base-mongo-repository'
import { CoreDeviceRepository } from '../interfaces/core-device-repository'
import { CoreDevice } from '../../../model/entities/core-device'
import { MongoDatabase } from './mongo-database'
import { MongoDevice, MongoEntityConverter } from './mongo-entity-converter'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoCoreDeviceRepository extends BaseMongoRepository implements CoreDeviceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDevices(): Promise<CoreDevice[]> {
    this.assertDatabaseConnection(MongoCoreDeviceRepository.prototype.getDevices.name)
    const mongoDevices: MongoDevice[] = await this.getCollection().find<MongoDevice>({}).toArray()
    return this.mongoEntityConverter.convertToCoreDevices(mongoDevices)
  }
}
