import { DeviceType } from '../enums/device-type'
import { StatusCode } from '../enums/status-code'

export type Device = CoreDevice | INewsDevice | TelemetricsDevice 

interface BasicDevice {
  type: DeviceType
  id: string
  name: string
  isConnected: boolean
  statusCode: StatusCode
  statusMessage: string
}

export interface CoreDevice extends BasicDevice {
  type: DeviceType
}

export interface INewsDevice extends BasicDevice {
  type: DeviceType.INEWS
  username: string
  password: string
}

export interface TelemetricsDevice extends BasicDevice {
  type: DeviceType.TELEMETRICS
  host: string
}
