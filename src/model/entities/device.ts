import { StatusCode } from '../enums/status-code'

export interface Device {
  id: string
  name: string
  isConnected: boolean
  statusCode: StatusCode
  statusMessage: string[]
}
