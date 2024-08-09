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
  type: DeviceType.INEWS_GATEWAY
  password: string | undefined
  host: string
  port: number
  queues: string[]
}

export class INewsDeviceDto extends DeviceDto implements INewsDeviceDtoInterface {
  public readonly type: DeviceType.INEWS_GATEWAY
  public readonly password: string | undefined
  public readonly host: string
  public readonly port: number
  public readonly queues: string[]

  constructor(device: INewsGatewayDevice) {
    super(device)
    this.type = DeviceType.INEWS_GATEWAY
    this.password = device.password
    this.host = device.host
    this.port = device.port
    this.queues = device.queues
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