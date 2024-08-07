import { WebSocket } from 'ws'
import { Device } from '../../model/entities/device'
import { DeviceConnection } from './interfaces/device-connection'
import { DeviceType } from '../../model/enums/device-type'
import { Logger } from '@tv2media/logger/*'
import { FixedIntervalReconnectStrategy } from './fixed-interval-reconnect-strategy'

export class INewsGatewayDeviceConnection implements DeviceConnection {
  private static instance: INewsGatewayDeviceConnection | null = null
  private readonly reconnectStrategy: FixedIntervalReconnectStrategy

  private readonly INEWS_GATEWAY_HOST: string = process.env.INEWS_GATEWAY_HOST ?? 'ws://localhost:3008'

  private client: WebSocket | null = null
  private pingTimeout: NodeJS.Timeout | null = null
  private isConnectingOrDisconnecting: boolean = false

  private constructor(private readonly device: Device, private readonly logger: Logger) {
    if (device?.type !== DeviceType.INEWS_GATEWAY) {
      throw new Error('Invalid device type')
    }

    this.reconnectStrategy = new FixedIntervalReconnectStrategy(this.logger)
    console.log('ReconnectStrategy initialized:', this.reconnectStrategy)
  }

  public static getInstance(device: Device, logger: Logger): INewsGatewayDeviceConnection {
    if (!INewsGatewayDeviceConnection.instance) {
      INewsGatewayDeviceConnection.instance = new INewsGatewayDeviceConnection(device, logger)
    }
    return INewsGatewayDeviceConnection.instance
  }

  public async send(_deviceId: string, _params: string[]): Promise<void> {
    if (!this.client) {
      throw new Error('Client is not initialized')
    }
    this.client.send(JSON.stringify(_params[0]))
    // For now: Simulate an async operation, e.g., network request
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  public async listen(_deviceId: string, _callback: (data: unknown) => void): Promise<void> {
    // For now: Simulate an async operation, e.g., network request
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  public async connect(): Promise<boolean> {
    if (this.isConnectingOrDisconnecting) {
      return Promise.reject(new Error('Already in a connecting or disconnecting state'))
    }

    if (this.client && this.client.readyState === WebSocket.OPEN) {
      return Promise.reject(new Error('Already connected to iNews Gateway'))
    }

    return this.reconnect()
  }

  private reconnect(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.isConnectingOrDisconnecting) {
        return reject(new Error('Device is already connecting or disconnecting.'))
      }

      this.isConnectingOrDisconnecting = true

      try {
        this.client = new WebSocket(this.INEWS_GATEWAY_HOST)
        this.initializeClientEvents()
        resolve(true)
      } catch (error) {
        this.client = null
        reject(error)
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }

  private initializeClientEvents(): void {
    if (!this.client) return

    this.client.on('error', (error) => {
      this.logger.error('WebSocket error:', error)
      INewsGatewayDeviceConnection.instance!.device.isConnected = false
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

      INewsGatewayDeviceConnection.instance!.device.isConnected = false

      this.logger.info(`WebSocket closed: Code ${code}, Reason: ${reason}`)

      this.reconnectStrategy.disconnected(() => {
        this.reconnect().catch(error => {
          this.logger.error('Error re-connecting:', error)
        })
      })
    })
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
    if (this.client?.readyState === WebSocket.OPEN) {
      this.client.terminate()
    }  
  }

  public async disconnect(): Promise<boolean> {
    if (this.isConnectingOrDisconnecting) {
      return Promise.reject(new Error('Device is already connecting or disconnecting.'))
    }
    
    this.isConnectingOrDisconnecting = true

    try {
      if (this.client?.readyState === WebSocket.OPEN) {
        this.client.close()
      }
   
      INewsGatewayDeviceConnection.instance!.device.isConnected = false
      return true
    } catch (error) {
      INewsGatewayDeviceConnection.instance!.device.isConnected = true
      throw error
    } finally {
      this.isConnectingOrDisconnecting = false
    }
  }
}
