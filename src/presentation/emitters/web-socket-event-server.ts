import WebSocket, { WebSocketServer } from 'ws'
import express from 'express'
import * as http from 'http'
import { RundownEvent } from '../value-objects/rundown-event'
import { EventServer } from './interfaces/event-server'
import { RundownEventListener } from '../interfaces/rundown-event-listener'
import { ActionTriggerEventListener } from '../interfaces/action-trigger-event-listener'
import { ActionTriggerEvent } from '../value-objects/action-trigger-event'

export class WebSocketEventServer implements EventServer {
  private static instance: EventServer

  public static getInstance(
    rundownEventListener: RundownEventListener,
    actionTriggerEventListener: ActionTriggerEventListener
  ): EventServer {
    if (!this.instance) {
      this.instance = new WebSocketEventServer(rundownEventListener, actionTriggerEventListener)
    }
    return this.instance
  }

  private webSocketServer?: WebSocket.Server

  private constructor(
    private readonly rundownEventListener: RundownEventListener,
    private readonly actionTriggerEventListener: ActionTriggerEventListener
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
      this.addListenerForWebSocket(webSocket)
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

  private addListenerForWebSocket(webSocket: WebSocket): void {
    this.rundownEventListener.listenToRundownEvents((rundownEvent: RundownEvent) => {
      webSocket.send(JSON.stringify(rundownEvent))
    })
    this.actionTriggerEventListener.listenToActionTriggerEvents((actionTriggerEvent: ActionTriggerEvent) => {
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
