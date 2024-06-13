import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDevice, MongoEntityConverter } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { Device } from '../../../model/entities/device'
import { Logger } from '../../../logger/logger'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoDeviceChangedListener extends BaseMongoRepository implements DataChangedListener<Device> {

  private readonly logger: Logger
  private onCreatedCallback: (device: Device) => void
  private onUpdatedCallback: (device: Device) => void

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoDeviceChangedListener.name)
    mongoDatabase.onConnect(DEVICE_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoDevice, ChangeStreamDocument<MongoDevice>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoDevice>) => this.onChange(change))
    this.logger.debug('Listening for Device collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoDevice>): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const mongoDevice: MongoDevice = change.fullDocument
        this.onCreatedCallback(this.mongoEntityConverter.convertToDevice(mongoDevice))
        return
      }
      case MongoChangeEvent.UPDATE: {
        const mongoDevice: MongoDevice | undefined = change.fullDocument
        if (!mongoDevice) {
          return
        }
        this.onUpdatedCallback(this.mongoEntityConverter.convertToDevice(mongoDevice))
        return
      }
    }
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (data: Device) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (data: Device) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(_onDeletedCallback: (id: string) => void): void {
    throw new UnsupportedOperationException(`${MongoDeviceChangedListener.name} does not support ${MongoDeviceChangedListener.prototype.onDeleted.name}`)
  }
}
