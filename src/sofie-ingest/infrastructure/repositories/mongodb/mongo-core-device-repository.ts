import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { DeviceRepository } from '../../../domain/repositories/device-repository'
import { CoreDevice } from '../../../domain/entities/device'
import {
  MongoCoreDevice, SofieIngestMongoEntityConverter
} from './sofie-ingest-mongo-entity-converter'
import { MongoId } from '../../../../cross-cutting-concerns/infrastructure/value-objects/mongo-id'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoCoreDeviceRepository extends BaseMongoRepository<MongoId> implements DeviceRepository {
  public constructor(mongoDatabase: MongoDatabase, private readonly sofieIngestMongoEntityConverter: SofieIngestMongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDevices(): Promise<CoreDevice[]> {
    this.assertDatabaseConnection(MongoCoreDeviceRepository.prototype.getDevices.name)
    const mongoDevices: MongoCoreDevice[] = await this.getCollection().find<MongoCoreDevice>({}).toArray()
    return this.sofieIngestMongoEntityConverter.convertToCoreDeviceInterfaces(mongoDevices)
  }
}
