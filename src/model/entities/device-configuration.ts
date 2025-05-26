import { DeviceType } from '../enums/device-type'
import { StatusCode } from '../enums/status-code'

export type DeviceConfiguration = INewsDeviceConfiguration | TelemetricsDeviceConfiguration

interface BasicDeviceConfiguration {
  type: DeviceType
  id: string
  name: string
  isDisabled: boolean
}

export interface INewsDeviceConfiguration extends BasicDeviceConfiguration {
  type: DeviceType.INEWS
  queues: string[]
}

export interface TelemetricsDeviceConfiguration extends BasicDeviceConfiguration {
  type: DeviceType.TELEMETRICS
  host: string
}

// "Core" devices are in their own flow, so they should not be included in the DeviceConfiguration type
export interface CoreDeviceConfiguration {
  id: string
  name: string
  type: DeviceType
  isConnected: boolean
  statusCode: StatusCode
  statusMessage: string
}
