import WebSocket, { WebSocketServer } from 'ws'
import express from 'express'
import * as http from 'http'
import { RundownEvent } from '../value-objects/rundown-event'
import { EventServer } from './interfaces/event-server'
import { RundownEventObserver } from '../interfaces/rundown-event-observer'
import { ActionTriggerEventObserver } from '../interfaces/action-trigger-event-observer'
import { ActionTriggerEvent } from '../value-objects/action-trigger-event'

export class WebSocketEventServer implements EventServer {
  private static instance: EventServer

  public static getInstance(
    rundownEventObserver: RundownEventObserver,
    actionTriggerEventObserver: ActionTriggerEventObserver
  ): EventServer {
    if (!this.instance) {
      this.instance = new WebSocketEventServer(rundownEventObserver, actionTriggerEventObserver)
    }
    return this.instance
  }

  private webSocketServer?: WebSocket.Server

  private constructor(
    private readonly rundownEventObserver: RundownEventObserver,
    private readonly actionTriggerEventObserver: ActionTriggerEventObserver
  ) {}

  public startServer(port: number): void {
    if (this.webSocketServer) {
      console.log('### Server is already started')
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
      console.log('### WebSocket successfully registered to Server')
      this.addObserversForWebSocket(webSocket)
    })

    this.webSocketServer.on('close', () => {
      console.log('### Server is closed')
      this.webSocketServer = undefined
    })
  }

  private createWebSocketServer(port: number): WebSocketServer {
    const app = express()
    const server = http.createServer(app)
    const webSocketServer = new WebSocketServer({ server })

    server.listen(port, () => {
      console.log(`### WebSocketServer started on port: ${port}`)
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
      console.log('### Server is already dead')
      return
    }
    console.log('### Killing Server')
    this.webSocketServer.close()
  }
}
