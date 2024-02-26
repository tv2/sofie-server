import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDevice } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions, ChangeStreamUpdateDocument } from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { Device } from '../../../model/entities/device'
import { StatusCode } from '../../../model/enums/status-code'
import { Logger } from '../../../logger/logger'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'

const DEVICE_COLLECTION_NAME: string = 'peripheralDevices'

export class MongoDeviceChangedListener extends BaseMongoRepository implements DataChangedListener<Device> {

  private readonly logger: Logger
  private onUpdatedCallback: (device: Device) => void

  constructor(mongoDatabase: MongoDatabase, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoDeviceChangedListener.name)
    mongoDatabase.onConnect(DEVICE_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoDevice, ChangeStreamDocument<MongoDevice>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoDevice>) => void this.onChange(change))
    this.logger.debug('Listening for Device collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoDevice>): void {
    switch (change.operationType) {
      case MongoChangeEvent.UPDATE: {
        const updateChange: ChangeStreamUpdateDocument<MongoDevice> = change as ChangeStreamUpdateDocument<MongoDevice>
        const mongoDevice: MongoDevice | undefined = updateChange.fullDocument
        if (!mongoDevice) {
          return
        }
        this.onUpdatedCallback(this.convertMongoDeviceToDevice(mongoDevice))
        return
      }
    }
  }

  private convertMongoDeviceToDevice(mongoDevice: MongoDevice): Device {
    const statusMessage: string[] = mongoDevice.status.messages.length === 0 ? [''] : mongoDevice.status.messages
    return {
      id: mongoDevice._id,
      name: mongoDevice.name,
      isConnected: mongoDevice.connected,
      statusCode: this.getStatusCode(mongoDevice.status.statusCode),
      statusMessage
    }
  }

  private getStatusCode(value: number): StatusCode {
    switch (value) {
      case 1: {
        return StatusCode.GOOD
      }
      case 2:
      case 3: {
        return StatusCode.WARNING
      }
      case 4:
      case 5: {
        return StatusCode.BAD
      }
      default: {
        return StatusCode.UNKNOWN
      }
    }
  }

  protected getCollectionName(): string {
    return DEVICE_COLLECTION_NAME
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onCreated(_onCreatedCallback: (data: Device) => void): void {
    throw new UnsupportedOperationException(`${MongoDeviceChangedListener.name} does not support ${MongoDeviceChangedListener.prototype.onCreated.name}`)
  }

  public onUpdated(onUpdatedCallback: (data: Device) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onDeleted(_onDeletedCallback: (id: string) => void): void {
    throw new UnsupportedOperationException(`${MongoDeviceChangedListener.name} does not support ${MongoDeviceChangedListener.prototype.onDeleted.name}`)
  }
}
