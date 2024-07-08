import { StatusCode } from '../enums/status-code'

export interface CoreDevice {
  id: string
  name: string
  isConnected: boolean
  statusCode: StatusCode
  statusMessage: string
}
