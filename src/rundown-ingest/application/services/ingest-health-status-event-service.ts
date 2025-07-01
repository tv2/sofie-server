import { IngestHealthStatusEventEmitter } from '../interfaces/ingest-health-status-event-emitter'
import { IngestHealthStatusEventObserver } from '../interfaces/ingest-health-status-event-observer'
import { IngestHealthStatusEventBuilder } from '../interfaces/ingest-health-status-event-builder'
import { IngestHealthStatus } from '../enum/ingest-health-status'
import { IngestHealthStatusEvent } from '../value-objects/ingest-health-status-event'

export class IngestHealthStatusEventService implements IngestHealthStatusEventEmitter, IngestHealthStatusEventObserver {
  private readonly callbacks: ((healthStatusEvent: IngestHealthStatusEvent) => void)[] = []

  public constructor(private readonly ingestHealthStatusEventBuilder: IngestHealthStatusEventBuilder) { }

  public emitHealthStatusEvent(healthStatusCode: IngestHealthStatus): void {
    const healthStatusEvent: IngestHealthStatusEvent = this.ingestHealthStatusEventBuilder.buildIngestHealthStatusEvent(healthStatusCode)
    this.callbacks.forEach(callback => callback(healthStatusEvent))
  }

  public subscribeToHealthStatusMessageEvents(onHealthStatusEventCallback: (healthStatusEvent: IngestHealthStatusEvent) => void): void {
    this.callbacks.push(onHealthStatusEventCallback)
  }
}
