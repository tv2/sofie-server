import { MediaEventEmitter } from '../interfaces/media-event-emitter'
import { MediaEventBuilder } from '../interfaces/media-event-builder'
import { MediaCreatedEvent, MediaDeletedEvent, MediaEvent, MediaUpdatedEvent } from '../value-objects/media-event'
import { Media } from '../../domain/entities/media'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class MediaEventService implements MediaEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly mediaEventBuilder: MediaEventBuilder) { }

  private emitMediaEvent(mediaEvent: MediaEvent): void {
    this.typedEventEmitter.emitTypedEvent(mediaEvent)
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
}
