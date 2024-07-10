import { INewsDevice, TelemetricsDevice } from '../../model/entities/device'
import { DeviceType } from '../../model/enums/device-type'
import { StatusCode } from '../../model/enums/status-code'

export interface DeviceDtoInterface {
  type: DeviceType
  id: string
  name: string
  isConnected: boolean
  statusCode: StatusCode
  statusMessage: string
}

export abstract class DeviceDto implements DeviceDtoInterface {
  public type: DeviceType
  public id: string
  public name: string
  public isConnected: boolean
  public statusCode: StatusCode
  public statusMessage: string

  constructor(device: DeviceDtoInterface) {
    this.type = device.type
    this.id = device.id
    this.name = device.name
    this.isConnected = device.isConnected
    this.statusCode = device.statusCode
    this.statusMessage = device.statusMessage
  }
}

export interface INewsDeviceDtoInterface extends DeviceDtoInterface {
  type: DeviceType.INEWS
  username: string
  password: string
}

export class INewsDeviceDto extends DeviceDto implements INewsDeviceDtoInterface {
  public type: DeviceType.INEWS
  public username: string
  public password: string

  constructor(device: INewsDevice) {
    super(device)
    this.type = DeviceType.INEWS
    this.username = device.username
    this.password = device.password
  }
}

export interface TelemetricsDeviceDtoInterface extends DeviceDtoInterface {
  type: DeviceType.TELEMETRICS
  host: string
}

export class TelemetricsDeviceDto extends DeviceDto implements TelemetricsDeviceDtoInterface {
  public type: DeviceType.TELEMETRICS
  public host: string

  constructor(device: TelemetricsDevice) {
    super(device)
    this.type = DeviceType.TELEMETRICS
    this.host = device.host
  }
}

export type ApiFilter = INewsDeviceDto | TelemetricsDeviceDto | undefined
