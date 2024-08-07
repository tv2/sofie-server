import { DeviceType } from '../../model/enums/device-type'
import { Device } from '../../model/entities/device'
import { DeviceConnection } from '../services/interfaces/device-connection'
import { INewsGatewayDeviceConnection } from '../services/inews-gateway-connection-implementation'
import { DeviceConnectionFactory } from '../services/interfaces/device-connection-factory'
import { Logger } from '@tv2media/logger/*'
import { LoggerFacade } from '../../logger/logger-facade'

export class DeviceConnectionFactoryImplementation implements DeviceConnectionFactory {
  constructor(private readonly logger: Logger){
  }
  
  public createDeviceConnection(device: Device): DeviceConnection | undefined {
    return this.mapDeviceToDeviceConnection(device)
  }

  public mapDeviceToDeviceConnection(device: Device): DeviceConnection | undefined {
    switch (device.type) {
      case DeviceType.INEWS_GATEWAY:
        return  INewsGatewayDeviceConnection.getInstance(device, LoggerFacade.createLogger())
      default:
        this.logger.info(`Unknown device type: ${device.type}`)
        return undefined
    }
  }
}
