import express, { Express } from 'express'
import * as http from 'http'
import { Server } from 'http'
import WebSocket, { Server as WsServer, WebSocketServer } from 'ws'
import { Logger } from '../interfaces/logger'
import { ActionEventObserver } from '../../../action-system/application/interfaces/action-event-observer'
import { TriggerEventObserver } from '../../../action-system/application/interfaces/trigger-event-observer'
import { MacroEventObserver } from '../../../action-system/application/interfaces/macro-event-observer'
import { ConfigurationEventObserver } from '../../../rundown-execution/application/interfaces/configuration-event-observer'
import { MediaEventObserver } from '../../../sofie-ingest/application/interfaces/media-event-observer'
import { RundownEventObserver } from '../../../rundown-execution/application/interfaces/rundown-event-observer'
import { StatusMessageEventObserver } from '../interfaces/status-message-event-observer'
import { ActionEvent } from '../../../action-system/application/value-objects/action-event'
import { TriggerEvent } from '../../../action-system/application/value-objects/trigger-event'
import { MacroEvent } from '../../../action-system/application/value-objects/macro-event'
import { ConfigurationEvent } from '../../../rundown-execution/application/value-objects/configuration-event'
import { MediaEvent } from '../../../sofie-ingest/application/value-objects/media-event'
import { RundownEvent } from '../../../rundown-execution/application/value-objects/rundown-event'
import { StatusMessageEvent } from '../value-objects/status-message-event'
import { EventServer } from '../../infrastructure/interfaces/event-server'
import { DeviceEventObserver } from '../../../rundown-execution/application/interfaces/device-event-observer'
import { DeviceEvent } from '../../../rundown-execution/application/value-objects/device-event'
import { TypedEvent } from '../value-objects/typed-event'
import { NtpEvent } from '../value-objects/ntp-event'
import { PlayoutContentEventObserver } from '../../../rundown-execution/application/interfaces/playout-content-event-observer'
import { PlayoutContentEvent } from '../../../rundown-execution/application/value-objects/playout-content-event'
import {NtpEventType} from '../enums/ntp-event-type'
import { HealthStatusEventObserver } from '../interfaces/health-status-event-observer'
import { HealthStatusEvent } from '../value-objects/health-status-event'

export class WebSocketEventServer implements EventServer {

  private readonly logger: Logger
  private webSocketServer?: WebSocket.Server

  constructor(
    private readonly rundownEventObserver: RundownEventObserver,
    private readonly actionEventObserver: ActionEventObserver,
    private readonly triggerEventObserver: TriggerEventObserver,
    private readonly macroEventObserver: MacroEventObserver,
    private readonly mediaEventObserver: MediaEventObserver,
    private readonly configurationEventObserver: ConfigurationEventObserver,
    private readonly statusMessageEventObserver: StatusMessageEventObserver,
    private readonly deviceEventObserver: DeviceEventObserver,
    private readonly playoutContentEventObserver: PlayoutContentEventObserver,
    private readonly healthStatusEventObserver: HealthStatusEventObserver,
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
    this.rundownEventObserver.subscribeToRundownEvents((rundownEvent: RundownEvent) => {
      webSocket.send(JSON.stringify(rundownEvent))
    })
    this.actionEventObserver.subscribeToActionEvents((actionEvent: ActionEvent) => {
      webSocket.send(JSON.stringify(actionEvent))
    })
    this.triggerEventObserver.subscribeToTriggerEvents((triggerEvent: TriggerEvent) => {
      webSocket.send(JSON.stringify(triggerEvent))
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
    this.playoutContentEventObserver.subscribeToPlayoutContentEvents((playoutContentEvent: PlayoutContentEvent) => {
      webSocket.send(JSON.stringify(playoutContentEvent))
    })
    this.healthStatusEventObserver.subscribeToHealthStatusMessageEvents((healthStatusEvent: HealthStatusEvent) => {
      webSocket.send(JSON.stringify(healthStatusEvent))
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
