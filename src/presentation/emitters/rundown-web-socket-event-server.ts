import WebSocket, { WebSocketServer } from 'ws'
import express from 'express'
import * as http from 'http'
import { RundownEvent } from '../value-objects/rundown-event'
import { RundownEventServer } from './interfaces/rundown-event-server'
import { RundownEventListener } from '../interfaces/rundown-event-listener'
import { LoggerService } from '../../model/services/logger-service'

export class RundownWebSocketEventServer implements RundownEventServer {
  private static instance: RundownEventServer

  public static getInstance(rundownEventListener: RundownEventListener, loggerService: LoggerService): RundownEventServer {
    if (!this.instance) {
      this.instance = new RundownWebSocketEventServer(rundownEventListener, loggerService)
    }
    return this.instance
  }

  private webSocketServer?: WebSocket.Server

  private constructor(private readonly rundownEventListener: RundownEventListener, private readonly loggerService: LoggerService) {
    this.loggerService.tag(RundownWebSocketEventServer.name)
  }

  public startServer(port: number): void {
    if (this.webSocketServer) {
      this.loggerService.info('Server is already started')
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
      this.loggerService.info('WebSocket successfully registered to Server')
      this.addListenerForWebSocket(webSocket)
    })

    this.webSocketServer.on('close', () => {
      this.loggerService.info('Websocket Server has closed')
      this.webSocketServer = undefined
    })
  }

  private createWebSocketServer(port: number): WebSocketServer {
    const app = express()
    const server = http.createServer(app)
    const webSocketServer = new WebSocketServer({ server })

    server.listen(port, () => {
      this.loggerService.info(`WebSocketServer started on port: ${port}`)
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
      this.loggerService.info('Websocket Server is already dead')
      return
    }
    this.loggerService.info('Killing Websocket Server')
    this.webSocketServer.close()
  }
}
