import { INewsGatewayDeviceConnection } from '../inews-gateway-connection-implementation'

export interface DeviceConnection<TParams> {
  connect(): Promise<boolean>
  disconnect(): Promise<boolean>
  send(deviceId: string, params: TParams): Promise<void>
  listen(deviceId: string, callback: (data: unknown) => void): Promise<void>
}

export interface INewsGatewayParams {
  headline?: string
  content: string
}

export type ParamsList = INewsGatewayDeviceConnection