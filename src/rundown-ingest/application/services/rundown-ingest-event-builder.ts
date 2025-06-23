import { IngestHealthStatusEventBuilder } from '../interfaces/ingest-health-status-event-builder'
import { IngestHealthStatus } from '../enum/ingest-health-status'
import { IngestHealthStatusEvent } from '../value-objects/ingest-health-status-event'
import { IngestHealthStatusEventType } from '../enum/ingest-health-status-event-type'

export class RundownIngestEventBuilder implements IngestHealthStatusEventBuilder {

  public buildIngestHealthStatusEvent(healthStatusCode: IngestHealthStatus): IngestHealthStatusEvent {
    return {
      type: IngestHealthStatusEventType.HEALTH_STATUS,
      timestamp: Date.now(),
      healthStatusCode
    }
  }
}
