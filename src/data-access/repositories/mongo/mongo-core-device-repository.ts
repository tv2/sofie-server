import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { MongoCoreDevice, MongoEntityConverter, MongoId } from './mongo-entity-converter'
import { DeviceRepository } from '../interfaces/device-repository'
import { CoreDevice } from '../../../model/entities/device'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoCoreDeviceRepository extends BaseMongoRepository<MongoId> implements DeviceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDevices(): Promise<CoreDevice[]> {
    this.assertDatabaseConnection(MongoCoreDeviceRepository.prototype.getDevices.name)
    const mongoDevices: MongoCoreDevice[] = await this.getCollection().find<MongoCoreDevice>({}).toArray()
    return this.mongoEntityConverter.convertToCoreDeviceInterfaces(mongoDevices)
  }
}
