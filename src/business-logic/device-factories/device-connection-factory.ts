import { DeviceType } from '../../model/enums/device-type'
import { Device } from '../../model/entities/device'
import { DeviceConnection } from '../services/interfaces/inewsgateway-device-connection'
import { INewsGatewayDeviceConnection } from '../services/inews-gateway-connection-implementation'

export class DeviceConnectionFactory implements DeviceConnectionFactory {
  public createDeviceConnection(device: Device): DeviceConnection<unknown> {
    const deviceConnection: DeviceConnection<unknown> = this.mapDeviceToDeviceConnection(device)
    return deviceConnection
  }

  public mapDeviceToDeviceConnection(device: Device): DeviceConnection<unknown> {
    switch (device.type) {
      case DeviceType.INEWSGATEWAY:
        return new INewsGatewayDeviceConnection(device)
      default:
        throw new Error(`Unknown device type: ${device.type}`)
    }
  }
}