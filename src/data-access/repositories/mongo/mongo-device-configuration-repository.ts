import { BaseMongoRepository } from './base-mongo-repository'
import { DeviceConfigurationRepository } from '../interfaces/device-configuration-repository'
import { DeviceConfiguration } from '../../../model/entities/device-configuration'
import { MongoDatabase } from './mongo-database'
import { UuidGenerator } from '../interfaces/uuid-generator'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { MongoDeviceConfiguration } from './mongo-entity-converter'

const DEVICE_COLLECTION_NAME: string = 'deviceConfigurations'

export class MongoDeviceConfigurationRepository extends BaseMongoRepository<MongoDeviceConfiguration> implements DeviceConfigurationRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDeviceConfigurations(): Promise<DeviceConfiguration[]> {
    this.assertDatabaseConnection(MongoDeviceConfigurationRepository.prototype.getDeviceConfigurations.name)
    return await this.getCollection().find<DeviceConfiguration>({}).toArray()
  }

  public async getDeviceConfiguration(deviceConfigurationId: string): Promise<DeviceConfiguration> {
    this.assertDatabaseConnection(MongoDeviceConfigurationRepository.prototype.getDeviceConfiguration.name)
    const deviceConfiguration: DeviceConfiguration | null = await this.getCollection().findOne<DeviceConfiguration>({ id: deviceConfigurationId })
    if (!deviceConfiguration) {
      throw new NotFoundException(`Unable to find device configuration with id '${deviceConfigurationId}'.`)
    }
    return deviceConfiguration
  }

  public async create(deviceConfiguration: DeviceConfiguration): Promise<DeviceConfiguration> {
    this.assertDatabaseConnection(MongoDeviceConfigurationRepository.prototype.create.name)
    const deviceConfigurationWithId: DeviceConfiguration = {
      ...deviceConfiguration,
      id: this.uuidGenerator.generateUuid(),
    }
    await this.getCollection().updateOne({ id: deviceConfigurationWithId.id }, { $set: deviceConfigurationWithId }, { upsert: true })
    return deviceConfigurationWithId
  }


  public async update(deviceConfiguration: DeviceConfiguration): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceConfigurationRepository.prototype.update.name)
    await this.assertDeviceConfigurationExist(deviceConfiguration.id)
    await this.getCollection().updateOne({ id: deviceConfiguration.id }, { $set: deviceConfiguration }, { upsert: true })
  }

  private async assertDeviceConfigurationExist(deviceConfigurationId: string): Promise<void> {
    const numberOfEntries: number = await this.getCollection().countDocuments({ id: deviceConfigurationId })
    if (numberOfEntries === 1) {
      return
    }
    throw new NotFoundException(`Device with id "${deviceConfigurationId}" does not exist`)
  }

  public async delete(deviceConfigurationId: string): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceConfigurationRepository.prototype.delete.name)
    await this.getCollection().deleteOne({ id: deviceConfigurationId })
  }
}
