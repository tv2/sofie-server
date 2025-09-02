import { IngestHealthStatus } from '../enum/ingest-health-status'
import { IngestHealthStatusEvent } from '../value-objects/ingest-health-status-event'

export interface IngestHealthStatusEventBuilder {
  buildIngestHealthStatusEvent(healthStatusCode: IngestHealthStatus): IngestHealthStatusEvent
}
