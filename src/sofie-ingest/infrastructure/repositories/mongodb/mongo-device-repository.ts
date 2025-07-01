import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { DeviceRepository } from '../../../domain/repositories/device-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { UuidGenerator } from '../../../../cross-cutting-concerns/infrastructure/interfaces/uuid-generator'
import { NotFoundException } from '../../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { CoreDevice } from '../../../domain/entities/device'
import {
  MongoCoreDevice
} from './sofie-ingest-mongo-entity-converter'

const DEVICE_COLLECTION_NAME: string = 'externalDevices'

export class MongoDeviceRepository extends BaseMongoRepository<MongoCoreDevice> implements DeviceRepository {
  public constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async getDevices(): Promise<CoreDevice[]> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.getDevices.name)
    return await this.getCollection().find<CoreDevice>({}).toArray()
  }

  public async getDevice(deviceId: string): Promise<CoreDevice> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.getDevice.name)
    const device: CoreDevice | null = await this.getCollection().findOne<CoreDevice>({ id: deviceId })
    if (!device) {
      throw new NotFoundException(`Unable to find device with id '${deviceId}'.`)
    }
    return device
  }

  public async save(device: CoreDevice | Omit<CoreDevice, 'id'>): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.save.name)
    const deviceWithId: CoreDevice = {
      ...device,
      id: this.uuidGenerator.generateUuid(),
    }
    await this.getCollection().updateOne({ id: deviceWithId.id }, { $set: deviceWithId }, { upsert: true })
  }

  public async update(device: CoreDevice): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.update.name)
    await this.getCollection().updateOne({ id: device.id }, { $set: device }, { upsert: true })
  }

  public async delete(deviceId: string): Promise<void> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.delete.name)
    await this.getCollection().deleteOne({ id: deviceId })
  }
}
