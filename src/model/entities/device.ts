import { DeviceType } from '../enums/device-type'
import { StatusCode } from '../enums/status-code'

export interface CoreDevice {
  type: DeviceType
  id: string
  name: string
  isConnected: boolean
  statusCode: StatusCode
  statusMessage: string
}
