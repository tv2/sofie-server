import { INewsGatewayDeviceConnection } from '../inews-gateway-connection-implementation'

export interface DeviceConnection<TParams> {
  connect(): Promise<boolean>
  disconnect(): Promise<boolean>
  send(deviceId: string, params: TParams): void
  listen(deviceId: string, callback: (data: unknown) => void): void
}

export interface INewsGatewayParams {
  headline: string
  content: string
}

export type ParamsList = INewsGatewayDeviceConnection