import { Socket } from '../interfaces/socket'
import WebSocket, { CloseEvent, ErrorEvent, Event, MessageEvent } from 'ws'
import { Logger } from '../../application/interfaces/logger'

const WEB_SOCKET_NORMAL_CLOSURE_CODE: number = 1000

export class ReconnectingWebSocket implements Socket {
  private webSocket: WebSocket

  private timeoutIdentifier?: NodeJS.Timeout
  private keepAlive: boolean = true

  private connectionString: string

  private onConnected: () => void
  private onData: (data: unknown) => void
  private onError: () => void
  private onClose: (isClosedByError: boolean) => void

  private readonly logger: Logger

  public constructor(logger: Logger) {
    this.logger = logger.tag('ReconnectingWebSocket')
  }

  public connect(
    connectionString: string,
    onConnected: () => void,
    onData: (data: unknown) => void,
    onError: () => void,
    onClose: (isClosedByError: boolean) => void
  ): void {
    this.connectionString = connectionString
    this.onConnected = onConnected
    this.onData = onData
    this.onError = onError
    this.onClose = onClose

    this.connectToNewSocket()
  }

  private connectToNewSocket(): void {
    this.webSocket?.close()
    this.webSocket = new WebSocket(this.connectionString)

    this.webSocket.addEventListener('open', (_event: Event) => {
      this.logger.debug(`Connected to WebSocket on ${this.connectionString}`)
      this.onConnected()
    })

    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      this.onData(event.data)
    })

    this.webSocket.addEventListener('error', (event: ErrorEvent) => {
      this.logger.data(event).error(`Error from WebSocket listening on: ${this.connectionString}`)
      this.onError()
    })

    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      this.logger.debug(`WebSocket listening on ${this.connectionString} was closed`)
      this.onClose(event.code !== WEB_SOCKET_NORMAL_CLOSURE_CODE)
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
}
