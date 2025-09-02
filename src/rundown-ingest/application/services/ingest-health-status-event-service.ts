import { IngestHealthStatusEventEmitter } from '../interfaces/ingest-health-status-event-emitter'
import { IngestHealthStatusEventBuilder } from '../interfaces/ingest-health-status-event-builder'
import { IngestHealthStatus } from '../enum/ingest-health-status'
import { IngestHealthStatusEvent } from '../value-objects/ingest-health-status-event'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class IngestHealthStatusEventService implements IngestHealthStatusEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly ingestHealthStatusEventBuilder: IngestHealthStatusEventBuilder) { }

  public emitHealthStatusEvent(healthStatusCode: IngestHealthStatus): void {
    const healthStatusEvent: IngestHealthStatusEvent = this.ingestHealthStatusEventBuilder.buildIngestHealthStatusEvent(healthStatusCode)
    this.typedEventEmitter.emitTypedEvent(healthStatusEvent)
  }
}
