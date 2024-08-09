import { WebSocket } from 'ws'
import { Device, INewsGatewayDevice } from '../../model/entities/device'
import { DeviceConnection } from './interfaces/device-connection'
import { DeviceType } from '../../model/enums/device-type'
import { Logger } from '@tv2media/logger/*'
import { FixedIntervalReconnectStrategy } from './fixed-interval-reconnect-strategy'
import { EventEmitterFacade } from '../../presentation/facades/event-emitter-facade'
import { DeviceEventObserver } from '../../presentation/interfaces/device-event-observer'
import { DeviceEvent, DeviceReconnectingEvent } from '../../presentation/value-objects/device-event'
import { DeviceEventType } from '../../presentation/enums/event-type'

export class INewsGatewayDeviceConnection implements DeviceConnection {
  private static instance: INewsGatewayDeviceConnection | null = null
  private readonly reconnectStrategy: FixedIntervalReconnectStrategy
  private readonly deviceEventObserver: DeviceEventObserver = EventEmitterFacade.createDeviceEventObserver()
  private client: WebSocket | null = null
  private pingTimeout: NodeJS.Timeout | null = null
  private isConnectingOrDisconnecting: boolean = false

  private constructor(private readonly device: Device, private readonly logger: Logger) {
    if (device?.type !== DeviceType.INEWS_GATEWAY) {
      throw new Error('Invalid device type')
    }

    if ((device as INewsGatewayDevice).queues === undefined) {
      throw new Error('iNewsGatewayDevice not configured correctly. Remember to set up host, port and queues to listen to.')
    }

    this.reconnectStrategy = new FixedIntervalReconnectStrategy(this.logger)
    this.logger.debug('ReconnectStrategy initialized:', this.reconnectStrategy)
  }

  public static getInstance(device: Device, logger: Logger): INewsGatewayDeviceConnection {
    if (!INewsGatewayDeviceConnection.instance) {
      INewsGatewayDeviceConnection.instance = new INewsGatewayDeviceConnection(device, logger)
    }
    return INewsGatewayDeviceConnection.instance
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
        this.initializeClientEvents(this.device as INewsGatewayDevice)
        resolve(true)
      } catch (error) {
        this.client = null
        reject(error)
      } finally {
        this.isConnectingOrDisconnecting = false
      }
    })
  }

  private initializeClientEvents(iDevice: INewsGatewayDevice): void {
    if (!this.validateDeviceParameters(iDevice)) {
      throw new Error('Invalid device parameters')
    }

    const url: string = this.buildWebSocketUrl(iDevice)
    console.log('WebSocket Parameter List:', encodeURIComponent(iDevice.queues.join(',')))
    console.log('url:', url)

    this.client = new WebSocket(url)

    if (this.client) {
      this.setupClientEventHandlers()
      this.subscribeToDeviceEvents()
    }
  }

  private validateDeviceParameters(iDevice: INewsGatewayDevice): boolean {
    return iDevice !== undefined && iDevice.host !== undefined && iDevice.port !== undefined
  }

  private buildWebSocketUrl(iDevice: INewsGatewayDevice): string {
    const queuesString: string = iDevice.queues.join(',')
    const encodedQueues: string = encodeURIComponent(queuesString)
    return `ws://${iDevice.host}:${iDevice.port}?queues=${encodedQueues}`
  }

  private setupClientEventHandlers(): void {
    this.client?.on('error', (error) => {
      this.logger.error('WebSocket error:', error)
      INewsGatewayDeviceConnection.instance!.device.isConnected = false
    })

    this.client?.on('open', () => {
      this.heartbeat()
    })

    this.client?.on('ping', () => {
      this.heartbeat()
    })

    this.client?.on('close', (code, _reason) => {
      this.handleWebSocketClose(code)
    })
  }

  private handleWebSocketClose(code: number): void {
    this.logger.info(`WebSocket closed. Code: ${code}`)

    if (this.pingTimeout !== null) {
      clearTimeout(this.pingTimeout)
    }

    INewsGatewayDeviceConnection.instance!.device.isConnected = false

    this.logger.info(`WebSocket closed: Code ${code}`)

    this.reconnectStrategy.disconnected(() => {
      this.reconnect().catch(error => {
        this.logger.error('Error re-connecting:', error)
      })
    })
  }

  private subscribeToDeviceEvents(): void {
    this.deviceEventObserver.subscribeToDeviceEvents((deviceEvent) => {
      if (this.isDeviceReconnectingEvent(deviceEvent) && this.device.id === deviceEvent.deviceId) {
        this.handleDeviceReconnecting()
      }
    })
  }

  private isDeviceReconnectingEvent(event: DeviceEvent): event is DeviceReconnectingEvent {
    return event.type === DeviceEventType.DEVICE_RECONNECTING
  }

  private handleDeviceReconnecting(): void {
    this.disconnect()
      .then(() => {
        this.connect().catch(error => this.logger.error(error))
      })
      .catch(error => {
        this.logger.error(error)
      })
  }

  private heartbeat(): void {
    if (this.pingTimeout !== null) {
      clearTimeout(this.pingTimeout)
    }

    this.pingTimeout = setTimeout(() => {
      this.terminate()
    }, 300_000)
  }

  private terminate(): void {
    this.logger.debug('terminate() called on the websocket')
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
        if (this.pingTimeout !== null) {
          clearTimeout(this.pingTimeout)
        }
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
}
