import { IngestHealthStatus } from '../enum/ingest-health-status'

export interface IngestGatewayConnector {
  connect(): void
  getStatus(): IngestHealthStatus
}
