import { DeviceConfiguration } from '../../model/entities/device-configuration'
import { StatusCode } from '../../model/enums/status-code'
import { Device } from '../../model/entities/devices/device'

export class DeviceDto {
  public readonly statusCode: StatusCode
  public readonly statusMessage: string
  public readonly configuration: DeviceConfiguration

  constructor(device: Device) {
    this.statusCode = device.getStatusCode()
    this.statusMessage = device.getStatusMessage()
    this.configuration = device.getConfiguration()
  }
}
