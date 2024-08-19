import { DeviceType } from '../../model/enums/device-type'
import { Device } from '../../model/entities/device'
import { DeviceConnection } from '../services/interfaces/device-connection'
import { INewsGatewayDeviceConnection } from '../services/inews-gateway-connection-implementation'
import { DeviceConnectionFactory } from '../services/interfaces/device-connection-factory'
import { LoggerFacade } from '../../logger/logger-facade'
import { DeviceNotFoundException } from '../../model/exceptions/device-not-found-exception'

export class DeviceConnectionFactoryImplementation implements DeviceConnectionFactory {
  constructor() {}

  public createDeviceConnection(device: Device): DeviceConnection {
    return this.mapDeviceToDeviceConnection(device)
  }

  private mapDeviceToDeviceConnection(device: Device): DeviceConnection {
    switch (device.type) {
      case DeviceType.INEWS_GATEWAY:
        return new INewsGatewayDeviceConnection(device, LoggerFacade.createLogger())
      default:
        throw new DeviceNotFoundException('Unable to map connected device to known devices.')
    }
  }
}
