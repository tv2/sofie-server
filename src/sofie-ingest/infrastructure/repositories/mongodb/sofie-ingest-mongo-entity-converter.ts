import { Media } from '../../../domain/entities/media'
import { CoreDevice } from '../../../domain/entities/device'
import { StatusCode } from '../../../../cross-cutting-concerns/domain/enums/status-code'
import { MongoId } from '../../../../cross-cutting-concerns/infrastructure/value-objects/mongo-id'
import { DeviceType } from '../../../domain/enums/device-type'

export interface MongoMedia extends MongoId {
  mediaId: string
  mediainfo?: {
    format?: {
      duration?: string
    }
  }
}

export interface MongoCoreDevice extends MongoId {
  name: string
  type: DeviceType
  status: {
    statusCode: number
    messages: string[]
  }
  connected: boolean
}

const MILLISECONDS_TO_SECONDS_RATIO: number = 1000

export class SofieIngestMongoEntityConverter {
  public convertMedia(mongoMedia: MongoMedia): Media {
    return {
      id: mongoMedia._id,
      sourceName: mongoMedia.mediaId,
      duration: mongoMedia.mediainfo?.format?.duration ? Number.parseFloat(mongoMedia.mediainfo?.format?.duration) * MILLISECONDS_TO_SECONDS_RATIO : 0
    }
  }

  public convertToCoreDeviceInterface(mongoDevice: MongoCoreDevice): CoreDevice {
    const statusMessage: string = mongoDevice.status.messages && mongoDevice.status.messages.length > 0
      ? mongoDevice.status.messages.reduce((previousValue, currentValue) => `${previousValue}; ${currentValue}`)
      : ''

    return {
      id: mongoDevice._id,
      name: mongoDevice.name,
      isConnected: mongoDevice.connected,
      statusCode: this.getStatusCode(mongoDevice.status.statusCode),
      statusMessage,
      type: mongoDevice.type
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

  public convertToCoreDeviceInterfaces(mongoDevices: MongoCoreDevice[]): CoreDevice[] {
    return mongoDevices.map(mongoDevice => this.convertToCoreDeviceInterface(mongoDevice))
  }
}
