import { WebSocket as AlbaWebSocket } from '../interfaces/web-socket'
import WebSocket, { CloseEvent, ErrorEvent, Event, MessageEvent } from 'ws'
import { Logger } from '../../application/interfaces/logger'

const WEB_SOCKET_NORMAL_CLOSURE_CODE: number = 1000
const WEB_SOCKET_DO_NOT_RECONNECT_CLOSURE_CODE: number = 3000

export class ReconnectingWebSocket implements AlbaWebSocket {
  private webSocket: WebSocket

  private timeoutIdentifier?: NodeJS.Timeout
  private keepAlive: boolean = true

  private connectionUrl: string

  private onConnected?: () => void
  private onClose?: (isClosedByError: boolean) => void
  private onData?: (data: unknown) => void
  private onError?: () => void

  private readonly logger: Logger

  public constructor(logger: Logger) {
    this.logger = logger.tag('ReconnectingWebSocket')
  }

  public connect(connectionUrl: string): void {
    this.connectionUrl = connectionUrl
    this.connectToNewSocket()
  }

  private connectToNewSocket(): void {
    this.webSocket?.close(WEB_SOCKET_DO_NOT_RECONNECT_CLOSURE_CODE)
    this.webSocket = new WebSocket(this.connectionUrl)

    this.webSocket.addEventListener('open', (_event: Event) => {
      this.logger.debug(`Connected to WebSocket on ${this.connectionUrl}`)
      this.onConnected?.()
    })

    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      this.onData?.(event.data)
    })

    this.webSocket.addEventListener('error', (event: ErrorEvent) => {
      this.logger.data(event).error(`Error from WebSocket listening on: ${this.connectionUrl}`)
      this.onError?.()
    })

    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      this.logger.debug(`WebSocket listening on ${this.connectionUrl} was closed`)
      this.onClose?.(event.code !== WEB_SOCKET_NORMAL_CLOSURE_CODE)
      if (event.code !== WEB_SOCKET_DO_NOT_RECONNECT_CLOSURE_CODE) {
        this.reconnect()
      }
    })
  }

  private reconnect(): void {
    clearTimeout(this.timeoutIdentifier)

    if (!this.keepAlive) {
      return
    }

    this.timeoutIdentifier = setTimeout(() => this.connectToNewSocket(), 5000)
  }

  public disconnect(): void {
    this.keepAlive = false
    clearTimeout(this.timeoutIdentifier)
    this.webSocket.close(WEB_SOCKET_NORMAL_CLOSURE_CODE)
  }

  public subscribeToOnConnected(onConnected: () => void): void {
    this.onConnected = onConnected
  }

  public subscribeToOnClosed(onClosed: (isClosedByError: boolean) => void): void {
    this.onClose = onClosed
  }

  public subscribeToData(onData: (data: unknown) => void): void {
    this.onData = onData
  }

  public subscribeToError(onError: () => void): void {
    this.onError = onError
  }
}
