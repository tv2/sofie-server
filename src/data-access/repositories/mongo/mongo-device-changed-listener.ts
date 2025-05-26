import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDeviceConfiguration, MongoEntityConverter } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { ChangeStream, ChangeStreamDeleteDocument, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { Logger } from '../../../logger/logger'
import { CoreDeviceConfiguration } from '../../../model/entities/device-configuration'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoDeviceChangedListener extends BaseMongoRepository<MongoDeviceConfiguration> implements DataChangedListener<CoreDeviceConfiguration> {

  private readonly logger: Logger
  private onCreatedCallback: (device: CoreDeviceConfiguration) => void
  private onUpdatedCallback: (device: CoreDeviceConfiguration) => void
  private onDeletedCallback: (deviceId: string) => void

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoDeviceChangedListener.name)
    mongoDatabase.onConnect(DEVICE_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoDeviceConfiguration, ChangeStreamDocument<MongoDeviceConfiguration>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoDeviceConfiguration>) => this.onChange(change))
    this.logger.debug('Listening for Device collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoDeviceConfiguration>): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const mongoDevice: MongoDeviceConfiguration = change.fullDocument
        this.onCreatedCallback(this.mongoEntityConverter.convertToCoreDeviceConfiguration(mongoDevice))
        return
      }
      case MongoChangeEvent.UPDATE: {
        const mongoDevice: MongoDeviceConfiguration | undefined = change.fullDocument
        if (!mongoDevice) {
          return
        }
        this.onUpdatedCallback(this.mongoEntityConverter.convertToCoreDeviceConfiguration(mongoDevice))
        return
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoDeviceConfiguration> = change as ChangeStreamDeleteDocument<MongoDeviceConfiguration>
        const deviceId: string = deleteChange.documentKey._id
        this.onDeletedCallback(deviceId)
      }
    }
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (data: CoreDeviceConfiguration) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (data: CoreDeviceConfiguration) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (id: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
