import { Socket } from '../interfaces/socket'
import WebSocket, { CloseEvent, ErrorEvent, Event, MessageEvent } from 'ws'
import { HealthStatus } from '../../application/enums/health-status'
import { HealthStatusEventEmitter } from '../../application/interfaces/health-status-event-emitter'
import {
  UnsupportedOperationException
} from '../../../rundown-execution/domain/exceptions/unsupported-operation-exception' // TODO: This is an illegal import. Are our Exceptions placed correctly in the new structure?

const WEB_SOCKET_NORMAL_CLOSURE_CODE: number = 1000

export class ReconnectingWebSocket implements Socket {

  private webSocket: WebSocket
  private healthStatus: HealthStatus = HealthStatus.UNKNOWN
  private healthStatusIdentifier: string

  private timeoutIdentifier?: NodeJS.Timeout
  private keepAlive: boolean = true

  constructor(private readonly healthStatusEventEmitter: HealthStatusEventEmitter) {
  }

  public setHealthStatusIdentifier(healthStatusIdentifier: string): void {
    this.healthStatusIdentifier = healthStatusIdentifier
  }

  public connect<T>(
    connectionString: string,
    onData: (data: T) => void,
  ): void {
    if (!this.healthStatusIdentifier) {
      throw new UnsupportedOperationException('It is not allowed to connect to a Socket without providing an identifier for the health status.')
    }

    this.webSocket = new WebSocket(connectionString)

    this.webSocket.addEventListener('open', (_event: Event) => {
      this.updateHealthStatus(HealthStatus.GOOD)
    })

    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      onData(JSON.parse(JSON.stringify(event.data)))
    })

    this.webSocket.addEventListener('error', (_event: ErrorEvent) => {
      this.updateHealthStatus(HealthStatus.BAD)
    })

    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      this.updateHealthStatus(event.code === WEB_SOCKET_NORMAL_CLOSURE_CODE ? HealthStatus.UNKNOWN : HealthStatus.BAD)
      this.reconnect<T>(connectionString, onData)
    })
  }

  private reconnect<T>(
    connectionString: string,
    onData: (data: T) => void,
  ): void {
    clearTimeout(this.timeoutIdentifier)

    if (!this.keepAlive) {
      return
    }

    this.timeoutIdentifier = setTimeout(() => this.connect(connectionString, onData), 5000)
  }

  private updateHealthStatus(newHealthStatus: HealthStatus): void {
    if (this.healthStatus === newHealthStatus) {
      return
    }
    this.healthStatus = newHealthStatus
    this.healthStatusEventEmitter.emitHealthStatusEvent(this.healthStatusIdentifier, this.healthStatus)
  }

  public disconnect(): void {
    this.keepAlive = false
    clearTimeout(this.timeoutIdentifier)
    this.webSocket.close(WEB_SOCKET_NORMAL_CLOSURE_CODE)
  }
}
