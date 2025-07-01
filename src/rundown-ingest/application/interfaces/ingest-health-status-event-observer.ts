import { IngestHealthStatusEvent } from '../value-objects/ingest-health-status-event'

export interface IngestHealthStatusEventObserver {
  subscribeToHealthStatusMessageEvents(onHealthStatusEventCallback: (healthStatusEvent: IngestHealthStatusEvent) => void): void
}
