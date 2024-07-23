import { Device, INewsGatewayDevice, TelemetricsDevice } from '../../model/entities/device'
import { DeviceType } from '../../model/enums/device-type'
import { StatusCode } from '../../model/enums/status-code'

export abstract class DeviceDto {
  public readonly type: DeviceType
  public readonly id: string
  public readonly name: string
  public readonly isConnected: boolean
  public readonly statusCode: StatusCode
  public readonly statusMessage: string

  constructor(device: Device) {
    this.type = device.type
    this.id = device.id
    this.name = device.name
    this.isConnected = device.isConnected
    this.statusCode = device.statusCode
    this.statusMessage = device.statusMessage
  }
}

export interface INewsDeviceDtoInterface {
  type: DeviceType.INEWSGATEWAY
  username: string
  password: string
}

export class INewsDeviceDto extends DeviceDto implements INewsDeviceDtoInterface {
  public readonly type: DeviceType.INEWSGATEWAY
  public readonly username: string
  public readonly password: string

  constructor(device: INewsGatewayDevice) {
    super(device)
    this.type = DeviceType.INEWSGATEWAY
    this.username = device.username
    this.password = device.password
  }
}

export interface TelemetricsDeviceDtoInterface {
  type: DeviceType.TELEMETRICS
  host: string
}

export class TelemetricsDeviceDto extends DeviceDto implements TelemetricsDeviceDtoInterface {
  public readonly type: DeviceType.TELEMETRICS
  public readonly host: string

  constructor(device: TelemetricsDevice) {
    super(device)
    this.type = DeviceType.TELEMETRICS
    this.host = device.host
  }
}