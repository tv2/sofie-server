import { WebSocket } from 'ws'
import { Device } from '../../model/entities/device'
import { DeviceConnection } from './interfaces/device-connection'

export class INewsGatewayDeviceConnection implements DeviceConnection {
  private readonly device: Device
  private readonly INEWS_GATEWAY_HOST: string = process.env.INEWS_GATEWAY_HOST ?? 'localhost:3008'

  private client: WebSocket
  private pingTimeout: NodeJS.Timeout
  private isConnectingOrDisconnecting: boolean = false

  constructor(device: Device) {
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
        return reject(new Error('Device is already connecting or disconnecting.'))
      }

      try {
        this.client = new WebSocket(this.INEWS_GATEWAY_HOST)
        this.initializeClientEvents()
        this.device.isConnected = true
        resolve(true)
  
      } catch (error) {
        this.device.isConnected = false
        reject(new Error('WebSocket connection failed: ' + error))
        return false
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }

  private initializeClientEvents(): boolean {
    this.client.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.device.isConnected = false
      // use logger instead to log reason for closing
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

      if (this.device.isConnected) {
        this.device.isConnected = false
      }
      // use logger instead to log reason for closing
      console.log(`WebSocket closed: Code ${code}, Reason: ${reason}`)

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
    if (this.client.readyState === WebSocket.OPEN) {
      this.client.terminate()
    }  
  }

  public async disconnect(): Promise<boolean> {
    return new Promise<boolean>((_resolve, reject) => { 
      if (this.isConnectingOrDisconnecting) {
        return reject(new Error('Device is already connecting or disconnecting.'))
      }
      this.isConnectingOrDisconnecting = true

      try {
        if (this.client.readyState === WebSocket.OPEN) {
          this.client.close()
        }
    
        if (this.pingTimeout !== null) {
          clearTimeout(this.pingTimeout)
        }      
        this.device.isConnected = false
        return true
      } catch (error) {
        this.device.isConnected = true
        return false
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }
}
  