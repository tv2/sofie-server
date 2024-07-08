import { StatusCode } from '../enums/status-code'
import { Device, DeviceDbDto, DeviceRestDto } from './device'

export class TelemetricsDevice extends Device {
  public type: string = 'TelemetricsDevice'
  private _host: string

  constructor(id: string, name: string, isConnected: boolean, statusCode: StatusCode, statusMessage: string, host: string) {
    super(id, name, isConnected, statusCode, statusMessage)
    this._host = host
  }

  // Getter
  public get host(): string {
    return this._host
  }

  // Setter
  public set host(value: string) {
    this._host = value
  }

  public connect(): void {
    console.log('Connecting to telemetrics device...')
  }
}


export class TelemetricsDeviceDBDTO extends DeviceDbDto {
  private _host: string

  constructor(device: Device, host: string) {
    super(device)
    this._host = host
  }

  // Getter
  public get host(): string {
    return this._host
  }

  // Setter
  public set host(value: string) {
    this._host = value
  }
}

export class TelemetricsDeviceRestDTO extends DeviceRestDto {
  private _host: string

  constructor(device: Device, host: string) {
    super(device)
    this._host = host
  }

  // Getter
  public get host(): string {
    return this._host
  }

  // Setter
  public set host(value: string) {
    this._host = value
  }
}
