import { IngestGatewayConnector } from '../../../rundown-ingest/application/interfaces/ingest-gateway-connector'
import { Socket } from '../../../cross-cutting-concerns/infrastructure/interfaces/socket'
import {
  IngestHealthStatusEventEmitter
} from '../../../rundown-ingest/application/interfaces/ingest-health-status-event-emitter'
import { IngestHealthStatus } from '../../../rundown-ingest/application/enum/ingest-health-status'

const HOST: string = process.env.INEWS_GATEWAY_HOST ?? 'localhost:3008'
const FEATURE_FLAG_DISABLED: boolean = process.env.DISABLE_INEWS_GATEWAY === 'true'

export class INewsGatewayConnector implements IngestGatewayConnector {
  private healthStatus: IngestHealthStatus = IngestHealthStatus.UNKNOWN

  public constructor(private readonly socket: Socket, private readonly ingestHealthStatusEventEmitter: IngestHealthStatusEventEmitter) {
  }

  public connect(): void {
    if (FEATURE_FLAG_DISABLED) {
      // TODO: This is temporary until we can release the new Ingest flow.
      return
    }

    this.socket.subscribeToOnConnected(() => this.updateHealthStatus(IngestHealthStatus.GOOD))
    this.socket.subscribeToOnClosed((isClosedByError: boolean) => this.updateHealthStatus(isClosedByError ? IngestHealthStatus.BAD : IngestHealthStatus.UNKNOWN))
    this.socket.subscribeToData(this.onData)
    this.socket.subscribeToError(() => this.updateHealthStatus(IngestHealthStatus.BAD))

    this.socket.connect(this.getConnectionString())
  }

  private getConnectionString(): string {
    const queues: string = ''
    return `${HOST}/?queues=${queues}`
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
