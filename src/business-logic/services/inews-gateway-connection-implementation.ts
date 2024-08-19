import { WebSocket } from 'ws'
import { INewsGatewayDevice } from '../../model/entities/device'
import { DeviceConnection } from './interfaces/device-connection'
import { DeviceType } from '../../model/enums/device-type'
import { Logger } from '@tv2media/logger/*'
import {DeviceAlreadyConnectedException} from '../../model/exceptions/device-already-connected-exception'

export class INewsGatewayDeviceConnection implements DeviceConnection {
  private readonly device: INewsGatewayDevice
  private readonly INEWS_GATEWAY_HOST: string = process.env.INEWS_GATEWAY_HOST ?? 'ws://localhost:3008'

  private client: WebSocket
  private pingTimeout: NodeJS.Timeout
  private isConnectingOrDisconnecting: boolean = false

  constructor(device: INewsGatewayDevice, private readonly logger: Logger) {
    if(this.device?.type === DeviceType.INEWS_GATEWAY){
      return
    }

    this.device = device
  }

  public async send(_deviceId: string, _params: string[]): Promise<void> {
    this.client.send(JSON.stringify(_params[0]))
    // For now: Simulate an async operation, e.g., network request
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  public async listen(_deviceId: string, _callback: (data: unknown) => void): Promise<void> {
    // For now: Simulate an async operation, e.g., network request
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  public async connect(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.isConnectingOrDisconnecting) {
        throw new DeviceAlreadyConnectedException('Tried to connecting device but it was already connecting/disconnecting.')
      }

      try {
        this.client = new WebSocket(this.INEWS_GATEWAY_HOST)
        this.initializeClientEvents()
        this.device.isConnected = true
        resolve(true)

      } catch (error) {
        this.device.isConnected = false
        reject(error)
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }

  private initializeClientEvents(): boolean {
    this.client.on('error', (error) => {
      this.logger.error('WebSocket error:', error)
      this.device.isConnected = false
    })

    this.client.on('open', () => {
      this.heartbeat()
    })

    this.client.on('ping', () => {
      this.heartbeat()
    })

    this.client.on('close', (code, reason) => {
      if (this.pingTimeout !== null) {
        clearTimeout(this.pingTimeout)
      }

      this.device.isConnected = false

      this.logger.info(`WebSocket closed: Code ${code}, Reason: ${reason}`)

      // reconnection logic
    })

    return this.device.isConnected
  }

  private heartbeat(): void {
    if (this.pingTimeout !== null) {
      clearTimeout(this.pingTimeout)
    }

    this.pingTimeout = setTimeout(() => {
      this.terminate()
    }, 30000 + 1000)
  }

  private terminate(): void {
    if (this.client.readyState !== WebSocket.OPEN) {
      this.client.terminate()
    }
  }

  public async disconnect(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.isConnectingOrDisconnecting) {
        return reject(new Error('Device is already connecting or disconnecting.'))
      }
      this.isConnectingOrDisconnecting = true

      try {
        if (this.client.readyState === WebSocket.OPEN) {
          this.client.close()
        }

        this.device.isConnected = false
        resolve(true)
      } catch (error) {
        this.device.isConnected = true
        reject(error)
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }
}
