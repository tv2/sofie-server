import { Media } from '../../../sofie-ingest/domain/entities/media'

export interface MediaEventEmitter {
  emitMediaCreated(media: Media): void
  emitMediaUpdated(media: Media): void
  emitMediaDeleted(mediaId: string): void
}
