import WebSocket, { WebSocketServer } from 'ws'
import express from 'express'
import * as http from 'http'
import { RundownEvent } from '../value-objects/rundown-event'
import { EventServer } from './interfaces/event-server'
import { RundownEventObserver } from '../interfaces/rundown-event-observer'
import { ActionTriggerEventObserver } from '../interfaces/action-trigger-event-observer'
import { ActionTriggerEvent } from '../value-objects/action-trigger-event'
import { Logger } from '../../logger'

export class WebSocketEventServer implements EventServer {
  private static instance: EventServer

  public static getInstance(
    rundownEventObserver: RundownEventObserver,
    actionTriggerEventObserver: ActionTriggerEventObserver,
    logger: Logger
  ): EventServer {
    if (!this.instance) {
      this.instance = new WebSocketEventServer(rundownEventObserver, actionTriggerEventObserver, logger)
    }
    return this.instance
  }

  private readonly logger: Logger
  private webSocketServer?: WebSocket.Server

  private constructor(
    private readonly rundownEventObserver: RundownEventObserver,
    private readonly actionTriggerEventObserver: ActionTriggerEventObserver,
    logger: Logger
  ) {
    this.logger = logger.tag(WebSocketEventServer.name)
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
      this.addObserversForWebSocket(webSocket)
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

  private addObserversForWebSocket(webSocket: WebSocket): void {
    this.rundownEventObserver.subscribeToRundownEvents((rundownEvent: RundownEvent) => {
      webSocket.send(JSON.stringify(rundownEvent))
    })
    this.actionTriggerEventObserver.subscribeToActionTriggerEvents((actionTriggerEvent: ActionTriggerEvent) => {
      webSocket.send(JSON.stringify(actionTriggerEvent))
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
