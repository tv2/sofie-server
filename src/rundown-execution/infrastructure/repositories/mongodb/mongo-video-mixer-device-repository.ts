import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { VideoMixerDeviceRepository } from '../../../domain/repositories/video-mixer-device-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { VideoMixerConfiguration } from '../../../domain/value-objects/video-mixer-configuration'
import { NotFoundException } from '../../../domain/exceptions/not-found-exception'
import { DeviceEventEmitter } from '../../../../business-logic/services/interfaces/device-event-emitter'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoChangeEvent } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-change-event'

interface MongoDevice {
  _id: string
  name: string
  settings: {
    devices: Record<string, {
      options: {
        host: string
        port: number
      }
    }>
  }
}

const COLLECTION_NAME: string = 'peripheralDevices'
const PLAYOUT_GATEWAY_POSTFIX: string = 'PlayoutCoreParent'
const VIDEO_MIXER_NAME: string = 'atem'

/**
 * This Repository only exists to fetch the hostname and port of the configured VideoMixer (currently hardcoded to Atem) while device settings reside in Sofie Core.
 * Once proper device settings are introduced in Alba this SHOULD be deleted!
 */
export class MongoVideoMixerDeviceRepository extends BaseMongoRepository<MongoDevice> implements VideoMixerDeviceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly deviceEventEmitter: DeviceEventEmitter) {
    super(mongoDatabase)
    mongoDatabase.onConnect(COLLECTION_NAME, () => this.listenForVideoMixerChanges())
  }

  private listenForVideoMixerChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoDevice, ChangeStreamDocument<MongoDevice>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoDevice>) => {
      switch (change.operationType) {
        case MongoChangeEvent.UPDATE: {
          const mongoDevice: MongoDevice | undefined = change.fullDocument
          if (!mongoDevice || !mongoDevice.settings || !mongoDevice.settings.devices) {
            return
          }
          const videoMixerConfiguration: VideoMixerConfiguration = this.findVideoMixerConfiguration(mongoDevice)
          this.deviceEventEmitter.emitVideoMixerConfigurationUpdated(videoMixerConfiguration)
          break
        }
        default: {
          // Ignore the rest
        }
      }
    })
  }

  private findVideoMixerConfiguration(mongoDevice: MongoDevice): VideoMixerConfiguration {
    const deviceName: string | undefined = Object.keys(mongoDevice.settings.devices).find(key => key.includes(VIDEO_MIXER_NAME))
    if (!deviceName) {
      throw new NotFoundException('No VideoMixer device configured')
    }
    return {
      hostname: mongoDevice.settings.devices[deviceName].options.host,
      port: mongoDevice.settings.devices[deviceName].options.port
    }
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getVideoMixerConfiguration(): Promise<VideoMixerConfiguration> {
    const mongoDevices: MongoDevice[] = await this.getCollection().find().toArray()
    const playoutGateway: MongoDevice | undefined = mongoDevices.find(mongoDevice => mongoDevice._id.toUpperCase().includes(PLAYOUT_GATEWAY_POSTFIX.toUpperCase()))
    if (!playoutGateway) {
      throw new NotFoundException('No PlayoutGateway configured')
    }
    return this.findVideoMixerConfiguration(playoutGateway)
  }
}
