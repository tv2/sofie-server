import WebSocket, { WebSocketServer } from 'ws'
import express from 'express'
import * as http from 'http'
import { RundownEvent } from '../value-objects/rundown-event'
import { EventServer } from './interfaces/event-server'
import { RundownEventObserver } from '../interfaces/rundown-event-observer'
import { ActionTriggerEventObserver } from '../interfaces/action-trigger-event-observer'
import { ActionTriggerEvent } from '../value-objects/action-trigger-event'
import { Logger } from '../../logger/logger'
import { MediaEventObserver } from '../interfaces/media-event-observer'
import { MediaEvent } from '../value-objects/media-event'
import { ConfigurationEventObserver } from '../interfaces/configuration-event-observer'
import { ConfigurationEvent } from '../value-objects/configuration-event'
import { StatusMessageEventObserver } from '../interfaces/status-message-event-observer'
import { StatusMessageEvent } from '../value-objects/status-message-event'

export class WebSocketEventServer implements EventServer {
  private static instance: EventServer

  public static getInstance(
    rundownEventObserver: RundownEventObserver,
    actionTriggerEventObserver: ActionTriggerEventObserver,
    mediaEventObserver: MediaEventObserver,
    configurationEventObserver: ConfigurationEventObserver,
    statusMessageEventObserver: StatusMessageEventObserver,
    logger: Logger
  ): EventServer {
    if (!this.instance) {
      this.instance = new WebSocketEventServer(
        rundownEventObserver,
        actionTriggerEventObserver,
        mediaEventObserver,
        configurationEventObserver,
        statusMessageEventObserver,
        logger
      )
    }
    return this.instance
  }

  private readonly logger: Logger
  private webSocketServer?: WebSocket.Server

  private constructor(
    private readonly rundownEventObserver: RundownEventObserver,
    private readonly actionTriggerEventObserver: ActionTriggerEventObserver,
    private readonly mediaEventObserver: MediaEventObserver,
    private readonly configurationEventObserver: ConfigurationEventObserver,
    private readonly statusMessageEventObserver: StatusMessageEventObserver,
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
      this.logger.info('WebSocket successfully registered to server')
      this.addObserversForWebSocket(webSocket)
    })

    this.webSocketServer.on('close', () => {
      this.logger.info('WebSocket server has closed')
      this.webSocketServer = undefined
    })
  }

  private createWebSocketServer(port: number): WebSocketServer {
    const app = express()
    const server = http.createServer(app)
    const webSocketServer = new WebSocketServer({ server })

    server.listen(port, () => {
      this.logger.info(`WebSocket server started on port: ${port}`)
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
    this.mediaEventObserver.subscribeToMediaEvents((mediaEvent: MediaEvent) => {
      webSocket.send(JSON.stringify(mediaEvent))
    })
    this.configurationEventObserver.subscribeToConfigurationEvents((configurationEvent: ConfigurationEvent) => {
      webSocket.send(JSON.stringify(configurationEvent))
    })
    this.statusMessageEventObserver.subscribeToStatusMessageEvents((statusMessageEvent: StatusMessageEvent) => {
      webSocket.send(JSON.stringify(statusMessageEvent))
    })
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
