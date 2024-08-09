import { DeviceType } from '../enums/device-type'
import { StatusCode } from '../enums/status-code'

export type Device = CoreDevice | INewsGatewayDevice | TelemetricsDevice

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

export interface INewsGatewayDevice extends BasicDevice {
  type: DeviceType.INEWS_GATEWAY
  queues: string[] 
  host: string
  port: number
  password?: string
}

export interface TelemetricsDevice extends BasicDevice {
  type: DeviceType.TELEMETRICS
  host: string
}
