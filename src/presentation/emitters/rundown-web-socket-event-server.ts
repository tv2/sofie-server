import WebSocket, { WebSocketServer } from 'ws'
import express from 'express'
import * as http from 'http'
import { RundownEvent } from '../value-objects/rundown-event'
import { RundownEventServer } from './interfaces/rundown-event-server'
import { RundownEventListener } from '../interfaces/rundown-event-listener'
import { Logger } from '../../logger'

export class RundownWebSocketEventServer implements RundownEventServer {
  private static instance: RundownEventServer

  public static getInstance(rundownEventListener: RundownEventListener, logger: Logger): RundownEventServer {
    if (!this.instance) {
      this.instance = new RundownWebSocketEventServer(rundownEventListener, logger)
    }
    return this.instance
  }

  private readonly logger: Logger
  private webSocketServer?: WebSocket.Server

  private constructor(private readonly rundownEventListener: RundownEventListener, logger: Logger) {
    this.logger = logger.tag(RundownWebSocketEventServer.name)
  }

  public startServer(port: number): void {
    if (this.webSocketServer) {
      this.logger.info('Server is already started')
      return
    }
    this.setupWebSocketServer(port)
  }

  private setupWebSocketServer(port: number): void {
    if (this.webSocketServer) {
      return
    }

    this.webSocketServer = this.createWebSocketServer(port)

    this.webSocketServer.on('connection', (webSocket: WebSocket) => {
      this.logger.info('WebSocket successfully registered to Server')
      this.addListenerForWebSocket(webSocket)
    })

    this.webSocketServer.on('close', () => {
      this.logger.info('Websocket Server has closed')
      this.webSocketServer = undefined
    })
  }

  private createWebSocketServer(port: number): WebSocketServer {
    const app = express()
    const server = http.createServer(app)
    const webSocketServer = new WebSocketServer({ server })

    server.listen(port, () => {
      this.logger.info(`WebSocketServer started on port: ${port}`)
    })

    return webSocketServer
  }

  private addListenerForWebSocket(webSocket: WebSocket): void {
    this.rundownEventListener.listenToRundownEvents((rundownEvent: RundownEvent) => {
      webSocket.send(JSON.stringify(rundownEvent))
    })
  }

  public killServer(): void {
    if (!this.webSocketServer) {
      this.logger.info('Websocket Server is already dead')
      return
    }
    this.logger.info('Killing Websocket Server')
    this.webSocketServer.close()
  }
}
