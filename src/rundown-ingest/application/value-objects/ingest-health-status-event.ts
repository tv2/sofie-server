import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { IngestHealthStatusEventType } from '../enum/ingest-health-status-event-type'
import { IngestHealthStatus } from '../enum/ingest-health-status'

export interface IngestHealthStatusEvent extends TypedEvent {
  type: IngestHealthStatusEventType.HEALTH_STATUS
  healthStatusCode: IngestHealthStatus
}
