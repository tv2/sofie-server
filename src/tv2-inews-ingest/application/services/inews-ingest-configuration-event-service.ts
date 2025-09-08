import { InewsIngestConfigurationEventEmitter } from '../interfaces/inews-ingest-configuration-event-emitter'
import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'
import { InewsIngestConfigurationUpdatedEvent } from '../value-objects/inews-ingest-configuration-event'
import { InewsIngestConfigurationEventBuilder } from '../interfaces/inews-ingest-configuration-event-builder'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class InewsIngestConfigurationEventService implements InewsIngestConfigurationEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly inewsIngestConfigurationEventBuilder: InewsIngestConfigurationEventBuilder) {
  }

  public emitInewsIngestConfigurationUpdated(inewsIngestConfiguration: InewsIngestConfiguration): void {
    const inewsIngestConfigurationUpdatedEvent: InewsIngestConfigurationUpdatedEvent = this.inewsIngestConfigurationEventBuilder.buildInewsIngestConfigurationUpdatedEvent(inewsIngestConfiguration)
    this.typedEventEmitter.emitTypedEvent(inewsIngestConfigurationUpdatedEvent)
  }
}
