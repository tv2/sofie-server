import { GatewayConnector } from '../../application/interfaces/gatewayConnector'
import { Socket } from '../../../cross-cutting-concerns/infrastructure/interfaces/socket'
import {
  IngestHealthStatusEventEmitter
} from '../../../rundown-ingest/application/interfaces/ingest-health-status-event-emitter'
import { IngestHealthStatus } from '../../../rundown-ingest/application/enum/ingest-health-status'

const HOST: string = process.env.INEWS_GATEWAY_HOST ?? 'ws://localhost:3008'
const FEATURE_FLAG: boolean = process.env.DISABLE_INEWS_GATEWAY === 'true'

export class INewsGatewayConnector implements GatewayConnector {

  private healthStatus: IngestHealthStatus = IngestHealthStatus.UNKNOWN

  constructor(private readonly socket: Socket, private readonly ingestHealthStatusEventEmitter: IngestHealthStatusEventEmitter) {
  }

  public connect(): void {
    if (FEATURE_FLAG) {
      // TODO: This is temporary until we can release the new Ingest flow.
      return
    }
    this.socket.connect(
      this.getConnectionString(),
      () => {
        this.updateHealthStatus(IngestHealthStatus.GOOD)
      },
      (data) => this.onData(data),
      () => {
        this.updateHealthStatus(IngestHealthStatus.BAD)
      },
      (isClosedByError: boolean) => {
        if (isClosedByError) {
          return
        }
        this.updateHealthStatus(IngestHealthStatus.UNKNOWN)
      }
    )
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
    console.log(_data)
  }
}
