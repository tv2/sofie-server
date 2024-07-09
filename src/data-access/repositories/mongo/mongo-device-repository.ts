/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseMongoRepository } from './base-mongo-repository'
import { DeviceRepository } from '../interfaces/device-repository'
import { Device } from '../../../model/entities/device'
import { MongoDatabase } from './mongo-database'
import { INewsDevice } from '../../../model/entities/inews-device'
import { TelemetricsDevice } from '../../../model/entities/telemetrics-device'
import { UuidGenerator } from '../interfaces/uuid-generator'
import { MongoEntityConverter, MongoINewsDevice, MongoTelemetricsDevice } from './mongo-entity-converter'


const DEVICE_COLLECTION_NAME: string = 'externalDevices'

export class MongoDeviceRepository extends BaseMongoRepository implements DeviceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly entityConverter: MongoEntityConverter, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public async findAllDevices(): Promise<(Device | INewsDevice | TelemetricsDevice)[]> {
    this.assertDatabaseConnection(MongoDeviceRepository.prototype.findAllDevices.name)
    const devices: (MongoINewsDevice | MongoTelemetricsDevice )[] = await this.getCollection().find<(MongoINewsDevice | MongoTelemetricsDevice)>({}).toArray() 
    return this.entityConverter.convertToDevices(devices)
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

  public async create(_deviceWithoutId: Device): Promise<void> {
    let dbDto: MongoINewsDevice | MongoTelemetricsDevice  = {
      username: '',
      password: '',
      _id: '',
      name: '',
      connected: false,
      status: {
        statusCode: 0,
        messages: []
      }
    }

    try {
      this.assertDatabaseConnection(MongoDeviceRepository.prototype.create.name)
      const uuid = this.uuidGenerator.generateUuid()
      dbDto = this.entityConverter.convertToDbDevice(_deviceWithoutId, uuid)
      await this.getCollection().insertOne({...dbDto, _id: dbDto._id})
    } catch (error) {
      console.error(`Error creating new device by id ${dbDto._id}:`, error)
    }
  }

  public update(_deviceId: string, _device: Device): Promise<Device[]> {
    throw new Error('NOT IMPLEMENTED')
  }
  
  public delete(_deviceId: string): Promise<Device[]> {
    throw new Error('NOT IMPLEMENTED')
  }


}

export interface DevicesDbDto {
  _id: string
   
}