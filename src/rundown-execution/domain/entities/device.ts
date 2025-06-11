import { DeviceType } from '../enums/device-type'
import { StatusCode } from '../../../cross-cutting-concerns/domain/enums/status-code'

export interface CoreDevice {
  type: DeviceType
  id: string
  name: string
  isConnected: boolean
  statusCode: StatusCode
  statusMessage: string
}
