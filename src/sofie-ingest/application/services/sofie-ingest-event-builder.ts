import { MediaEventBuilder } from '../interfaces/media-event-builder'
import { Media } from '../../domain/entities/media'
import { MediaCreatedEvent, MediaDeletedEvent, MediaUpdatedEvent } from '../value-objects/media-event'
import { MediaEventType } from '../enums/media-event-type'
import { MediaDto } from '../dtos/media-dto'

export class SofieIngestEventBuilder implements MediaEventBuilder {
  public buildMediaCreatedEvent(media: Media): MediaCreatedEvent {
    return {
      type: MediaEventType.MEDIA_CREATED,
      timestamp: Date.now(),
      media: new MediaDto(media),
    }
  }

  public buildMediaUpdatedEvent(media: Media): MediaUpdatedEvent {
    return {
      type: MediaEventType.MEDIA_UPDATED,
      timestamp: Date.now(),
      media: new MediaDto(media),
    }
  }

  public buildMediaDeletedEvent(mediaId: string): MediaDeletedEvent {
    return {
      type: MediaEventType.MEDIA_DELETED,
      timestamp: Date.now(),
      mediaId: mediaId,
    }
  }
}
