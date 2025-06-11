import { IngestEventType } from '../../../leftovers/event-type'
import { MediaDto } from '../../../rundown-execution/application/dtos/media-dto'
import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'


export type MediaEvent = MediaCreatedEvent | MediaUpdatedEvent | MediaDeletedEvent

export interface MediaCreatedEvent extends TypedEvent {
  type: IngestEventType.MEDIA_CREATED
  media: MediaDto
}

export interface MediaUpdatedEvent extends TypedEvent {
  type: IngestEventType.MEDIA_UPDATED
  media: MediaDto
}

export interface MediaDeletedEvent extends TypedEvent {
  type: IngestEventType.MEDIA_DELETED
  mediaId: string
}
