import { BaseMongoRepository } from './base-mongo-repository'
import { VideoMixerDeviceRepository } from '../interfaces/video-mixer-device-repository'
import { MongoDatabase } from './mongo-database'
import { VideoMixerConfiguration } from '../../../model/value-objects/video-mixer-configuration'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

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
 * This Repository only exist to fetch the hostname and port of the configured VideoMixer (currently hardcoded to Atem) while device settings resides in Sofie.
 * Once proper device settings is introduced in Alba. This SHOULD be deleted!
 */
export class MongoVideoMixerDeviceRepository extends BaseMongoRepository<MongoDevice> implements VideoMixerDeviceRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
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

    const key: string | undefined = Object.keys(playoutGateway.settings.devices).find(key => key.includes(VIDEO_MIXER_NAME))
    if (!key) {
      throw new NotFoundException('No VideoMixer device configured')
    }
    return {
      hostname: playoutGateway.settings.devices[key].options.host,
      port: playoutGateway.settings.devices[key].options.port
    }
  }
}
