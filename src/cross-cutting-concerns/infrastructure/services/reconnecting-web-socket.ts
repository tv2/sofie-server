import { Socket } from '../interfaces/socket'
import WebSocket, { CloseEvent, ErrorEvent, Event, MessageEvent } from 'ws'
import { Logger } from '../../application/interfaces/logger'

const WEB_SOCKET_CONNECTION_PREFIX: string = 'ws://'
const WEB_SOCKET_NORMAL_CLOSURE_CODE: number = 1000

export class ReconnectingWebSocket implements Socket {
  private webSocket: WebSocket

  private timeoutIdentifier?: NodeJS.Timeout
  private keepAlive: boolean = true

  private ipAddress: string

  private onConnected?: () => void
  private onClose?: (isClosedByError: boolean) => void
  private onData?: (data: unknown) => void
  private onError?: () => void

  private readonly logger: Logger

  public constructor(logger: Logger) {
    this.logger = logger.tag('ReconnectingWebSocket')
  }

  public connect(ipAddress: string): void {
    this.ipAddress = ipAddress
    this.connectToNewSocket()
  }

  private connectToNewSocket(): void {
    this.webSocket?.close()
    this.webSocket = new WebSocket(`${WEB_SOCKET_CONNECTION_PREFIX}${this.ipAddress}`)

    this.webSocket.addEventListener('open', (_event: Event) => {
      this.logger.debug(`Connected to WebSocket on ${this.ipAddress}`)
      this.onConnected?.()
    })

    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      this.onData?.(event.data)
    })

    this.webSocket.addEventListener('error', (event: ErrorEvent) => {
      this.logger.data(event).error(`Error from WebSocket listening on: ${this.ipAddress}`)
      this.onError?.()
    })

    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      this.logger.debug(`WebSocket listening on ${this.ipAddress} was closed`)
      this.onClose?.(event.code !== WEB_SOCKET_NORMAL_CLOSURE_CODE)
      this.reconnect()
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
