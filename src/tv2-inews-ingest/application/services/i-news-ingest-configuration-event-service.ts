import { INewsIngestConfigurationEventEmitter } from '../interfaces/i-news-ingest-configuration-event-emitter'
import { INewsIngestConfigurationEventObserver } from '../interfaces/i-news-ingest-configuration-event-observer'
import { INewsIngestConfiguration } from '../../domain/entities/i-news-ingest-configuration'
import {
  INewsIngestConfigurationEvent,
  INewsIngestConfigurationUpdatedEvent
} from '../value-objects/i-news-ingest-configuration-event'
import { INewsIngestConfigurationEventBuilder } from '../interfaces/i-news-ingest-configuration-event-builder'

export class INewsIngestConfigurationEventService implements INewsIngestConfigurationEventEmitter, INewsIngestConfigurationEventObserver {
  private readonly callbacks: ((iNewsIngestConfigurationEvent: INewsIngestConfigurationEvent) => void)[] = []

  public constructor(private readonly iNewsIngestConfigurationEventBuilder: INewsIngestConfigurationEventBuilder) {
  }

  public emitINewsIngestConfigurationUpdated(iNewsIngestConfiguration: INewsIngestConfiguration): void {
    const iNewsIngestConfigurationUpdatedEvent: INewsIngestConfigurationUpdatedEvent = this.iNewsIngestConfigurationEventBuilder.buildINewsIngestConfigurationUpdatedEvent(iNewsIngestConfiguration)
    this.emitEvent(iNewsIngestConfigurationUpdatedEvent)
  }

  private emitEvent(iNewsIngestConfigurationEvent: INewsIngestConfigurationEvent): void {
    this.callbacks.forEach(callback => callback(iNewsIngestConfigurationEvent))
  }

  public subscribeToINewsIngestConfigurationEvents(onINewsIngestConfigurationEventCallback: (iNewsIngestConfigurationEvent: INewsIngestConfigurationEvent) => void): void {
    this.callbacks.push(onINewsIngestConfigurationEventCallback)
  }
}
