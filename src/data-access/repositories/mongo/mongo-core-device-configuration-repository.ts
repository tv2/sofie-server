import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { MongoDeviceConfiguration, MongoEntityConverter, MongoId } from './mongo-entity-converter'
import { DeviceConfigurationRepository } from '../interfaces/device-configuration-repository'
import { DeviceConfiguration } from '../../../model/entities/device-configuration'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoCoreDeviceConfigurationRepository extends BaseMongoRepository<MongoId> implements DeviceConfigurationRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  public delete(_deviceConfigurationId: string): Promise<void> {
    throw new UnsupportedOperationException(this.delete.name)
  }

  public update(_deviceConfiguration: DeviceConfiguration): Promise<void> {
    throw new UnsupportedOperationException(this.getDeviceConfiguration.name)
  }

  public getDeviceConfiguration(_deviceConfigurationId: string): Promise<DeviceConfiguration> {
    throw new UnsupportedOperationException(this.getDeviceConfiguration.name)
  }

  public create(_deviceConfiguration: DeviceConfiguration): Promise<DeviceConfiguration> {
    throw new UnsupportedOperationException(this.create.name)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDeviceConfigurations(): Promise<DeviceConfiguration[]> {
    this.assertDatabaseConnection(MongoCoreDeviceConfigurationRepository.prototype.getDeviceConfigurations.name)
    const mongoDevices: MongoDeviceConfiguration[] = await this.getCollection().find<MongoDeviceConfiguration>({}).toArray()
    return this.mongoEntityConverter.convertToCoreDeviceConfigurations(mongoDevices) as unknown as DeviceConfiguration[]
  }
}
