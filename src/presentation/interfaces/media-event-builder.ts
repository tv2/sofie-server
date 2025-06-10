import { Media } from '../../rundown-execution/domain/entities/media'
import { MediaCreatedEvent, MediaDeletedEvent, MediaUpdatedEvent } from '../value-objects/media-event'

export interface MediaEventBuilder {
  buildMediaCreatedEvent(media: Media): MediaCreatedEvent
  buildMediaUpdatedEvent(media: Media): MediaUpdatedEvent
  buildMediaDeletedEvent(mediaId: string): MediaDeletedEvent
}
