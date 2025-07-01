import { IngestHealthStatus } from '../enum/ingest-health-status'

export interface IngestGatewayConnector {
  connect(queueIds: string[]): void
  getStatus(): IngestHealthStatus
}
