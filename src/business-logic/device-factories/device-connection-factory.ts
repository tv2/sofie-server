import { DeviceConnection, INewsGatewayDeviceConnection, TelemetriceDeviceConnection } from '../services/interfaces/device-connection-service'
import { DeviceType } from '../../model/enums/device-type'
import { Device } from '../../model/entities/device'

export class DeviceConnectionFactory implements DeviceConnectionFactory {
  public createDeviceConnection(device: Device): DeviceConnection {
    const deviceConnection: DeviceConnection = this.mapDeviceToDeviceConnection(device)
    return deviceConnection
  }

  public mapDeviceToDeviceConnection(device: Device): DeviceConnection {
    switch (device.type) {
      case DeviceType.TELEMETRICS:
        return new TelemetriceDeviceConnection(device)
      case DeviceType.INEWSGATEWAY:
        return new INewsGatewayDeviceConnection(device)
      default:
        throw new Error(`Unknown device type: ${device.type}`)
    }
  }
}