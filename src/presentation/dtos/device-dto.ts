import { Device } from '../../model/entities/device'
import { INewsDevice } from '../../model/entities/inews-device'
import { TelemetricsDevice } from '../../model/entities/telemetrics-device'

export class DeviceDto {
  public readonly id: string
  public readonly name: string
  public readonly type: string
  public readonly isConnected: boolean
  public readonly statusCode: string

  constructor(device: Device) {
    this.id = device.id
    this.name = device.name
    this.isConnected = device.isConnected
    this.statusCode = device.statusCode
    this.type = device.type
  }
}

export class INewsDeviceDto extends DeviceDto {
  public readonly username: string
  public readonly password: string

  constructor(device: INewsDevice, username: string, password: string) {
    super(device)
    this.username = username
    this.password = password
  }
}

export class TelemetricsDeviceDto extends DeviceDto {
  public readonly host: string
    
  constructor(device: TelemetricsDevice, host:string)
  {
    super(device)
    this.host = host
  }
}


