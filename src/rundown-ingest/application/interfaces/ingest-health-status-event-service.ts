import { IngestHealthStatusEventEmitter } from './ingest-health-status-event-emitter'
import { IngestHealthStatusEventObserver } from './ingest-health-status-event-observer'
import { IngestHealthStatusEventBuilder } from './ingest-health-status-event-builder'
import { IngestHealthStatus } from '../enum/ingest-health-status'
import { IngestHealthStatusEvent } from '../value-objects/ingest-health-status-event'

export class IngestHealthStatusEventService implements IngestHealthStatusEventEmitter, IngestHealthStatusEventObserver {

  private readonly callbacks: ((healthStatusEvent: IngestHealthStatusEvent) => void)[] = []

  constructor(private readonly healthStatusMessageBuilder: IngestHealthStatusEventBuilder) { }

  public emitHealthStatusEvent(healthStatusCode: IngestHealthStatus): void {
    const healthStatusEvent: IngestHealthStatusEvent = this.healthStatusMessageBuilder.buildIngestHealthStatusEvent(healthStatusCode)
    this.callbacks.forEach(callback => callback(healthStatusEvent))
  }

  public subscribeToHealthStatusMessageEvents(onHealthStatusEventCallback: (healthStatusEvent: IngestHealthStatusEvent) => void): void {
    this.callbacks.push(onHealthStatusEventCallback)
  }
}
