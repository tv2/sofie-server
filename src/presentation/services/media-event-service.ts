import { MediaEventEmitter } from '../../business-logic/services/interfaces/media-event-emitter'
import { MediaEventObserver } from '../interfaces/media-event-observer'
import { MediaEventBuilder } from '../interfaces/media-event-builder'
import { MediaCreatedEvent, MediaDeletedEvent, MediaEvent, MediaUpdatedEvent } from '../value-objects/media-event'
import { Media } from '../../model/entities/media'

export class MediaEventService implements MediaEventEmitter, MediaEventObserver {
  private static instance: MediaEventService

  public static getInstance(mediaEventBuilder: MediaEventBuilder): MediaEventService {
    if (!this.instance) {
      this.instance = new MediaEventService(mediaEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((mediaEvent: MediaEvent) => void)[] = []

  constructor(private readonly mediaEventBuilder: MediaEventBuilder) { }

  private emitMediaEvent(mediaEvent: MediaEvent): void {
    this.callbacks.forEach(callback => callback(mediaEvent))
  }

  public emitMediaCreated(media: Media): void {
    const event: MediaCreatedEvent = this.mediaEventBuilder.buildMediaCreatedEvent(media)
    this.emitMediaEvent(event)
  }

  public emitMediaUpdated(media: Media): void {
    const event: MediaUpdatedEvent = this.mediaEventBuilder.buildMediaUpdatedEvent(media)
    this.emitMediaEvent(event)
  }

  public emitMediaDeleted(mediaId: string): void {
    const event: MediaDeletedEvent = this.mediaEventBuilder.buildMediaDeletedEvent(mediaId)
    this.emitMediaEvent(event)
  }

  public subscribeToMediaEvents(onMediaEventCallback: (mediaEvent: MediaEvent) => void): void {
    this.callbacks.push(onMediaEventCallback)
  }
}
