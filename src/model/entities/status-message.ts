import { StatusCode } from '../enums/status-code'

export interface StatusMessage {
  id: string
  statusCode: StatusCode
  title: string
  message: string
}
