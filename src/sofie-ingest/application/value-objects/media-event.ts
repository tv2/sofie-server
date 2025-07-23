import { MediaDto } from '../dtos/media-dto'
import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'

import { MediaEventType } from '../enums/media-event-type'

export type MediaEvent = MediaCreatedEvent | MediaUpdatedEvent | MediaDeletedEvent

export interface MediaCreatedEvent extends TypedEvent {
  type: MediaEventType.MEDIA_CREATED
  media: MediaDto
}

export interface MediaUpdatedEvent extends TypedEvent {
  type: MediaEventType.MEDIA_UPDATED
  media: MediaDto
}

export interface MediaDeletedEvent extends TypedEvent {
  type: MediaEventType.MEDIA_DELETED
  mediaId: string
}
