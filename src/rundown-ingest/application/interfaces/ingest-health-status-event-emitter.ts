import { IngestHealthStatus } from '../enum/ingest-health-status'

export interface IngestHealthStatusEventEmitter {
  emitHealthStatusEvent(healthStatusCode: IngestHealthStatus): void
}
