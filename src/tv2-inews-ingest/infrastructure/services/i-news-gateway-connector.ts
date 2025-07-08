import { IngestGatewayConnector } from '../../../rundown-ingest/application/interfaces/ingest-gateway-connector'
import { WebSocket } from '../../../cross-cutting-concerns/infrastructure/interfaces/web-socket'
import {
  IngestHealthStatusEventEmitter
} from '../../../rundown-ingest/application/interfaces/ingest-health-status-event-emitter'
import { IngestHealthStatus } from '../../../rundown-ingest/application/enum/ingest-health-status'

const HOST: string = process.env.INEWS_GATEWAY_HOST ?? ''
const DISABLE_INEWS_GATEWAY_CONNECTION: boolean = HOST.trim() === ''

export class INewsGatewayConnector implements IngestGatewayConnector {
  private healthStatus: IngestHealthStatus = IngestHealthStatus.UNKNOWN

  public constructor(private readonly webSocket: WebSocket, private readonly ingestHealthStatusEventEmitter: IngestHealthStatusEventEmitter) {
  }

  public connect(queueIds: string[]): void {
    if (DISABLE_INEWS_GATEWAY_CONNECTION) {
      // TODO: This is temporary until we can release the new Ingest flow.
      return
    }

    this.webSocket.subscribeToOnConnected(() => this.updateHealthStatus(IngestHealthStatus.GOOD))
    this.webSocket.subscribeToOnClosed((isClosedByError: boolean) => this.updateHealthStatus(isClosedByError ? IngestHealthStatus.BAD : IngestHealthStatus.UNKNOWN))
    this.webSocket.subscribeToData(this.onData)
    this.webSocket.subscribeToError(() => this.updateHealthStatus(IngestHealthStatus.BAD))

    this.webSocket.connect(this.getConnectionString(queueIds))
  }

  private getConnectionString(queueIds: readonly string[]): string {
    return `${HOST}/?queues=${queueIds.join(',')}`
  }

  private updateHealthStatus(healthStatus: IngestHealthStatus): void {
    if (this.healthStatus === healthStatus) {
      return
    }
    this.healthStatus = healthStatus
    this.ingestHealthStatusEventEmitter.emitHealthStatusEvent(this.healthStatus)
  }

  private onData(_data: unknown): void {
    // TODO: Implement in later task - Update type as well.
  }

  public getStatus(): IngestHealthStatus {
    return this.healthStatus
  }
}
