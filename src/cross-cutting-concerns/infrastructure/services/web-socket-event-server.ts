import express, { Express } from 'express'
import * as http from 'http'
import { Server } from 'http'
import WebSocket, { Server as WsServer, WebSocketServer } from 'ws'
import { Logger } from '../../application/interfaces/logger'
import { EventServer } from '../interfaces/event-server'
import { TypedEvent } from '../../application/value-objects/typed-event'
import { NtpEvent } from '../../application/value-objects/ntp-event'
import { NtpEventType } from '../../application/enums/ntp-event-type'
import { TypedEventObserver } from '../../application/interfaces/typed-event-observer'

// TODO: This class could be split up in the transport mechanism and the application use case for propagating events.
export class WebSocketEventServer implements EventServer {
  private readonly logger: Logger
  private webSocketServer?: WebSocket.Server

  public constructor(
    private readonly typedEventObserver: TypedEventObserver,
    logger: Logger
  ) {
    this.logger = logger.tag(WebSocketEventServer.name)
  }

  public async startServer(port: number): Promise<void> {
    if (this.webSocketServer) {
      this.logger.info('WebSocket server is already started.')
      return
    }
    await this.setupWebSocketServer(port)
  }

  private async setupWebSocketServer(port: number): Promise<void> {
    if (this.webSocketServer) {
      return
    }

    this.webSocketServer = await this.createWebSocketServer(port)

    this.webSocketServer.on('connection', (webSocket: WebSocket) => {
      this.logger.info('WebSocket connection successfully registered to server.')
      this.addObserversForWebSocket(webSocket)
    })

    this.webSocketServer.on('close', () => {
      this.logger.info('WebSocket server has closed.')
      this.webSocketServer = undefined
    })
  }

  private createWebSocketServer(port: number): Promise<WebSocketServer> {
    return new Promise<WebSocketServer>((resolve) => {
      const app: Express = express()
      const server: Server = http.createServer(app)
      const webSocketServer: WsServer = new WebSocketServer({ server })

      server.listen(port, () => {
        this.logger.info(`WebSocket server started on port ${port}.`)
        resolve(webSocketServer)
      })
    })
  }

  private addObserversForWebSocket(webSocket: WebSocket): void {
    this.typedEventObserver.subscribeToTypedEvents((typedEvent: TypedEvent) => webSocket.send(JSON.stringify(typedEvent)))

    webSocket.onmessage = (message: WebSocket.MessageEvent): void => {
      const messageText: string = message.data.toString()
      const event: TypedEvent | undefined = this.parseTypedEvent(messageText)

      if (!event) {
        this.logger.warn(`Expected typed event, but got: ${messageText}`)
        return
      }

      if (event.type === NtpEventType.NTP) {
        const ntpEvent: NtpEvent = { type: event.type, clientTimestamp: event.timestamp, timestamp: Date.now() }
        webSocket.send(JSON.stringify(ntpEvent))
      }
    }
  }

  private parseTypedEvent(eventText: string): TypedEvent | undefined {
    try {
      const event: unknown = JSON.parse(eventText)
      return this.isTypedEvent(event) ? event : undefined
    } catch {
      return
    }
  }

  private isTypedEvent(event: unknown): event is TypedEvent {
    if (typeof event !== 'object' || event === null) {
      return false
    }
    if (!('type' in event) || typeof event.type !== 'string') {
      return false
    }
    return 'timestamp' in event && typeof event.timestamp === 'number'
  }

  public stopServer(): void {
    if (!this.webSocketServer) {
      this.logger.info('WebSocket server is already dead')
      return
    }
    this.logger.info('Killing WebSocket server')
    this.webSocketServer.close()
  }
}
