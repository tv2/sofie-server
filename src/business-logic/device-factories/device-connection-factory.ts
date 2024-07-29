import { DeviceType } from '../../model/enums/device-type'
import { Device } from '../../model/entities/device'
import { DeviceConnection } from '../services/interfaces/device-connection'
import { INewsGatewayDeviceConnection } from '../services/inews-gateway-connection-implementation'
import { DeviceConnectionFactory } from '../services/interfaces/device-connection-factory'

export class DeviceConnectionFactoryImplementation implements DeviceConnectionFactory {
  public createDeviceConnection(device: Device): DeviceConnection {
    return this.mapDeviceToDeviceConnection(device)
  }

  public mapDeviceToDeviceConnection(device: Device): DeviceConnection {
    switch (device.type) {
      case DeviceType.INEWSGATEWAY:
        return new INewsGatewayDeviceConnection(device)
      default:
        throw new Error(`Unknown device type: ${device.type}`)
    }
  }
}
