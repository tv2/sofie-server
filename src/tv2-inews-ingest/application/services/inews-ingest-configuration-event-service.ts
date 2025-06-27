import { InewsIngestConfigurationEventEmitter } from '../interfaces/inews-ingest-configuration-event-emitter'
import { InewsIngestConfigurationEventObserver } from '../interfaces/inews-ingest-configuration-event-observer'
import { InewsIngestConfiguration } from '../../domain/entities/inews-ingest-configuration'
import {
  InewsIngestConfigurationEvent,
  InewsIngestConfigurationUpdatedEvent
} from '../value-objects/inews-ingest-configuration-event'
import { InewsIngestConfigurationEventBuilder } from '../interfaces/inews-ingest-configuration-event-builder'

export class InewsIngestConfigurationEventService implements InewsIngestConfigurationEventEmitter, InewsIngestConfigurationEventObserver {
  private readonly callbacks: ((inewsIngestConfigurationEvent: InewsIngestConfigurationEvent) => void)[] = []

  public constructor(private readonly inewsIngestConfigurationEventBuilder: InewsIngestConfigurationEventBuilder) {
  }

  public emitInewsIngestConfigurationUpdated(inewsIngestConfiguration: InewsIngestConfiguration): void {
    const inewsIngestConfigurationUpdatedEvent: InewsIngestConfigurationUpdatedEvent = this.inewsIngestConfigurationEventBuilder.buildInewsIngestConfigurationUpdatedEvent(inewsIngestConfiguration)
    this.emitEvent(inewsIngestConfigurationUpdatedEvent)
  }

  private emitEvent(inewsIngestConfigurationEvent: InewsIngestConfigurationEvent): void {
    this.callbacks.forEach(callback => callback(inewsIngestConfigurationEvent))
  }

  public subscribeToInewsIngestConfigurationEvents(onInewsIngestConfigurationEventCallback: (inewsIngestConfigurationEvent: InewsIngestConfigurationEvent) => void): void {
    this.callbacks.push(onInewsIngestConfigurationEventCallback)
  }
}
