import express, { Express } from 'express'
import * as http from 'http'
import { Server } from 'http'
import WebSocket, { Server as WsServer, WebSocketServer } from 'ws'
import { Logger } from '../../logger/logger'
import { ActionEventObserver } from '../interfaces/action-event-observer'
import { ActionTriggerEventObserver } from '../interfaces/action-trigger-event-observer'
import { MacroEventObserver } from '../interfaces/macro-event-observer'
import { ConfigurationEventObserver } from '../interfaces/configuration-event-observer'
import { MediaEventObserver } from '../interfaces/media-event-observer'
import { RundownEventObserver } from '../interfaces/rundown-event-observer'
import { StatusMessageEventObserver } from '../interfaces/status-message-event-observer'
import { ActionEvent } from '../value-objects/action-event'
import { ActionTriggerEvent } from '../value-objects/action-trigger-event'
import { MacroEvent } from '../value-objects/macro-event'
import { ConfigurationEvent } from '../value-objects/configuration-event'
import { MediaEvent } from '../value-objects/media-event'
import { RundownEvent } from '../value-objects/rundown-event'
import { StatusMessageEvent } from '../value-objects/status-message-event'
import { EventServer } from './interfaces/event-server'
import { DeviceEventObserver } from '../interfaces/device-event-observer'
import { DeviceEvent } from '../value-objects/device-event'
import { TypedEvent } from '../value-objects/typed-event'
import { NtpEvent } from '../value-objects/ntp-event'
import { NtpEventType } from '../enums/event-type'

export class WebSocketEventServer implements EventServer {
  private static instance: EventServer

  public static getInstance(
    rundownEventObserver: RundownEventObserver,
    actionEventObserver: ActionEventObserver,
    actionTriggerEventObserver: ActionTriggerEventObserver,
    macroEventObserver: MacroEventObserver,
    mediaEventObserver: MediaEventObserver,
    configurationEventObserver: ConfigurationEventObserver,
    statusMessageEventObserver: StatusMessageEventObserver,
    deviceEventObserver: DeviceEventObserver,
    logger: Logger
  ): EventServer {
    if (!this.instance) {
      this.instance = new WebSocketEventServer(
        rundownEventObserver,
        actionEventObserver,
        actionTriggerEventObserver,
        macroEventObserver,
        mediaEventObserver,
        configurationEventObserver,
        statusMessageEventObserver,
        deviceEventObserver,
        logger
      )
    }
    return this.instance
  }

  private readonly logger: Logger
  private webSocketServer?: WebSocket.Server

  private constructor(
    private readonly rundownEventObserver: RundownEventObserver,
    private readonly actionEventObserver: ActionEventObserver,
    private readonly actionTriggerEventObserver: ActionTriggerEventObserver,
    private readonly macroEventObserver: MacroEventObserver,
    private readonly mediaEventObserver: MediaEventObserver,
    private readonly configurationEventObserver: ConfigurationEventObserver,
    private readonly statusMessageEventObserver: StatusMessageEventObserver,
    private readonly deviceEventObserver: DeviceEventObserver,
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
    const app: Express = express()
    const server: Server = http.createServer(app)
    const webSocketServer: WsServer = new WebSocketServer({ server })

    server.listen(port, () => {
      this.logger.info(`WebSocket server started on port: ${port}`)
    })

    return webSocketServer
  }

  private addObserversForWebSocket(webSocket: WebSocket): void {
    this.rundownEventObserver.subscribeToRundownEvents((rundownEvent: RundownEvent) => {
      webSocket.send(JSON.stringify(rundownEvent))
    })
    this.actionEventObserver.subscribeToActionEvents((actionEvent: ActionEvent) => {
      webSocket.send(JSON.stringify(actionEvent))
    })
    this.actionTriggerEventObserver.subscribeToActionTriggerEvents((actionTriggerEvent: ActionTriggerEvent) => {
      webSocket.send(JSON.stringify(actionTriggerEvent))
    })
    this.macroEventObserver.subscribeToMacroEvents((macro: MacroEvent) => {
      webSocket.send(JSON.stringify(macro))
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
    this.deviceEventObserver.subscribeToDeviceEvents((deviceEvent: DeviceEvent) => {
      webSocket.send(JSON.stringify(deviceEvent))
    })

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
