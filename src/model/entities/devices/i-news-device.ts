import { StatusCode } from '../../enums/status-code'
import WebSocket, { CloseEvent, ErrorEvent, Event, MessageEvent } from 'ws'
import { Device } from './device'
import { INewsDeviceConfiguration } from '../device-configuration'
import { StatusMessageEventEmitter } from '../../../business-logic/services/interfaces/status-message-event-emitter'

const INEWS_HOST: string = process.env.INEWS_HOST ?? 'ws://localhost:3008'

export class INewsDevice extends Device {

  private socket: WebSocket

  constructor(
    private readonly iNewsDeviceConfiguration: INewsDeviceConfiguration,
    statuesMessageEventEmitter: StatusMessageEventEmitter,
    onStatusUpdatedCallback: (device: Device) => void
  ) {
    super(iNewsDeviceConfiguration, statuesMessageEventEmitter, onStatusUpdatedCallback)
  }

  public getStatusCode(): StatusCode {
    if (!this.socket) {
      return StatusCode.UNKNOWN
    }

    switch (this.socket.readyState) {
      case WebSocket.OPEN: {
        return StatusCode.GOOD
      }
      case WebSocket.CONNECTING:
      case WebSocket.CLOSING:
      case WebSocket.CLOSED: {
        return StatusCode.BAD
      }
      default: {
        return StatusCode.UNKNOWN
      }
    }
  }

  protected connectToDevice(
    onConnectedCallback: () => void,
    onErrorCallback: (errorMessage: string) => void,
    onDisconnectedCallback: () => void
  ): void {
    this.socket = new WebSocket(this.getConnectionString())

    this.socket.addEventListener('open', (_event: Event) => {
      onConnectedCallback()
    })

    this.socket.addEventListener('message', (_event: MessageEvent) => {
      // TODO: Implement
    })

    this.socket.addEventListener('error', (error: ErrorEvent) => {
      onErrorCallback(error.message)
    })

    this.socket.addListener('close', (_event: CloseEvent) => {
      onDisconnectedCallback()
    })
  }

  private getConnectionString(): string {
    const queues: string = this.iNewsDeviceConfiguration.queues ? this.iNewsDeviceConfiguration.queues.join(',') : ''
    return `${INEWS_HOST}/?queues=${queues}`
  }

  protected disconnectFromDevice(): void {
    if (!this.socket) {
      return
    }

    this.socket.close()
  }
}
