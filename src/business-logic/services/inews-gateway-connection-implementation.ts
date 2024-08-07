import { WebSocket } from 'ws'
import { Device } from '../../model/entities/device'
import { DeviceConnection } from './interfaces/device-connection'
import { DeviceType } from '../../model/enums/device-type'
import { Logger } from '@tv2media/logger/*'

export class INewsGatewayDeviceConnection implements DeviceConnection {
  private static device: Device
  private readonly INEWS_GATEWAY_HOST: string = process.env.INEWS_GATEWAY_HOST ?? 'ws://localhost:3008'

  private client: WebSocket
  private pingTimeout: NodeJS.Timeout
  private isConnectingOrDisconnecting: boolean = false

  constructor(device: Device, private readonly logger: Logger) {
    if(INewsGatewayDeviceConnection.device?.type === DeviceType.INEWS_GATEWAY){
      return 
    }

    INewsGatewayDeviceConnection.device = device
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
        return reject(new Error('Device is already connecting or disconnecting.'))
      }

      try {
        this.client = new WebSocket(this.INEWS_GATEWAY_HOST)
        this.initializeClientEvents()
        INewsGatewayDeviceConnection.device.isConnected = true
        resolve(true)
  
      } catch (error) {
        INewsGatewayDeviceConnection.device.isConnected = false
        reject(error)
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }

  private initializeClientEvents(): boolean {
    this.client.on('error', (error) => {
      this.logger.error('WebSocket error:', error)
      INewsGatewayDeviceConnection.device.isConnected = false
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

      INewsGatewayDeviceConnection.device.isConnected = false

      this.logger.info(`WebSocket closed: Code ${code}, Reason: ${reason}`)

      // reconnection logic
    })

    return INewsGatewayDeviceConnection.device.isConnected
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
    if (this.client.readyState === WebSocket.OPEN) {
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
     
        INewsGatewayDeviceConnection.device.isConnected = false
        resolve
      } catch (error) {
        INewsGatewayDeviceConnection.device.isConnected = true
        reject(error)
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }
}
  