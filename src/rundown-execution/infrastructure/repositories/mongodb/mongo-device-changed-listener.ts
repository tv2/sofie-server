import { DataChangedListener } from '../../../../cross-cutting-concerns/application/interfaces/data-changed-listener'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { ChangeStream, ChangeStreamDeleteDocument, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoChangeEvent } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-change-event'
import { Logger } from '../../../../cross-cutting-concerns/application/interfaces/logger'
import { CoreDevice } from '../../../domain/entities/device'
import {
  MongoCoreDevice, SofieIngestMongoEntityConverter
} from '../../../../sofie-ingest/infrastructure/repositories/mongodb/sofie-ingest-mongo-entity-converter'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoDeviceChangedListener extends BaseMongoRepository<MongoCoreDevice> implements DataChangedListener<CoreDevice> {
  private readonly logger: Logger
  private onCreatedCallback: (device: CoreDevice) => void
  private onUpdatedCallback: (device: CoreDevice) => void
  private onDeletedCallback: (deviceId: string) => void

  public constructor(mongoDatabase: MongoDatabase, private readonly sofieIngestMongoEntityConverter: SofieIngestMongoEntityConverter, logger: Logger) {
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
        this.onCreatedCallback(this.sofieIngestMongoEntityConverter.convertToCoreDeviceInterface(mongoDevice))
        return
      }
      case MongoChangeEvent.UPDATE: {
        const mongoDevice: MongoCoreDevice | undefined = change.fullDocument
        if (!mongoDevice) {
          return
        }
        this.onUpdatedCallback(this.sofieIngestMongoEntityConverter.convertToCoreDeviceInterface(mongoDevice))
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
