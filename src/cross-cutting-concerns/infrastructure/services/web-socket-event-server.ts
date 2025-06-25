import express, { Express } from 'express'
import * as http from 'http'
import { Server } from 'http'
import WebSocket, { Server as WsServer, WebSocketServer } from 'ws'
import { Logger } from '../../application/interfaces/logger'
import { EventListener, EventServer } from '../../application/interfaces/event-server'
import { UuidGenerator } from '../interfaces/uuid-generator'

const WEBSOCKET_INTERNAL_ERROR_CLOSED_CODE: number = 1011

export class WebSocketEventServer implements EventServer {
  private readonly logger: Logger
  private webSocketServer?: WebSocket.Server
  private eventListener?: EventListener
  private readonly activeConnections: Map<string, WebSocket> = new Map()

  public constructor(
    private readonly uuidGenerator: UuidGenerator,
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

  public setEventListener(eventListener: EventListener): void {
    this.eventListener = eventListener
  }

  private async setupWebSocketServer(port: number): Promise<void> {
    if (this.webSocketServer) {
      return
    }

    this.webSocketServer = await this.createWebSocketServer(port)

    this.webSocketServer.on('connection', (webSocket: WebSocket) => {
      this.logger.info('WebSocket connection successfully registered to server.')
      this.registerWebSocketConnection(webSocket)
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

  private registerWebSocketConnection(webSocket: WebSocket): void {
    const connectionId: string = this.uuidGenerator.generateUuid()
    this.activeConnections.get(connectionId)?.close(WEBSOCKET_INTERNAL_ERROR_CLOSED_CODE)
    this.activeConnections.set(connectionId, webSocket)
    webSocket.onmessage = (message: WebSocket.MessageEvent): void => {
      this.eventListener?.(message.data.toString())
    }
    webSocket.onclose = (): void => {
      this.activeConnections.delete(connectionId)
    }
  }

  public emitEvent(event: string): void {
    this.activeConnections.forEach(webSocket => webSocket.send(event))
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
