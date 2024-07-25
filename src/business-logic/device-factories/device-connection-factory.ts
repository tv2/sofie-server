import { DeviceType } from '../../model/enums/device-type'
import { Device } from '../../model/entities/device'
import { DeviceConnection, INewsGatewayParams } from '../services/interfaces/inewsgateway-device-connection'
import { INewsGatewayDeviceConnection } from '../services/inews-gateway-connection-implementation'
import { DeviceConnectionFactory } from '../services/interfaces/device-connection-factory'

export class DeviceConnectionFactoryImplementation implements DeviceConnectionFactory {
  public createDeviceConnection<INewsGatewayParams>(device: Device): DeviceConnection<INewsGatewayParams> {
    const deviceConnection: DeviceConnection<unknown> = this.mapDeviceToDeviceConnection(device)
    return deviceConnection
  }

  public mapDeviceToDeviceConnection(device: Device): DeviceConnection<INewsGatewayParams> {
    switch (device.type) {
      case DeviceType.INEWSGATEWAY:
        return new INewsGatewayDeviceConnection(device)
      default:
        throw new Error(`Unknown device type: ${device.type}`)
    }
  }
}