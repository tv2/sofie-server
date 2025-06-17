import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoCoreDevice, MongoEntityConverter, MongoId } from './mongo-entity-converter'
import { DeviceRepository } from '../../../domain/repositories/device-repository'
import { CoreDevice } from '../../../domain/entities/device'

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
