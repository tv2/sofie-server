import { DataChangedListener } from '../../../../data-access/repositories/interfaces/data-changed-listener'
import { MongoCoreDevice, MongoEntityConverter } from './mongo-entity-converter'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { ChangeStream, ChangeStreamDeleteDocument, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoChangeEvent } from '../../../../data-access/repositories/mongo/mongo-enums'
import { Logger } from '../../../../cross-cutting-concerns/application/logger'
import { CoreDevice } from '../../../domain/entities/device'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoDeviceChangedListener extends BaseMongoRepository<MongoCoreDevice> implements DataChangedListener<CoreDevice> {

  private readonly logger: Logger
  private onCreatedCallback: (device: CoreDevice) => void
  private onUpdatedCallback: (device: CoreDevice) => void
  private onDeletedCallback: (deviceId: string) => void

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoDeviceChangedListener.name)
    mongoDatabase.onConnect(DEVICE_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoCoreDevice, ChangeStreamDocument<MongoCoreDevice>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoCoreDevice>) => this.onChange(change))
    this.logger.debug('Listening for Device collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoCoreDevice>): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const mongoDevice: MongoCoreDevice = change.fullDocument
        this.onCreatedCallback(this.mongoEntityConverter.convertToCoreDeviceInterface(mongoDevice))
        return
      }
      case MongoChangeEvent.UPDATE: {
        const mongoDevice: MongoCoreDevice | undefined = change.fullDocument
        if (!mongoDevice) {
          return
        }
        this.onUpdatedCallback(this.mongoEntityConverter.convertToCoreDeviceInterface(mongoDevice))
        return
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoCoreDevice> = change as ChangeStreamDeleteDocument<MongoCoreDevice>
        const deviceId: string = deleteChange.documentKey._id
        this.onDeletedCallback(deviceId)
      }
    }
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (data: CoreDevice) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (data: CoreDevice) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (id: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
