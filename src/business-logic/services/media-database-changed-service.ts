import { DataChangeService } from './interfaces/data-change-service'
import { MediaEventEmitter } from './interfaces/media-event-emitter'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { Media } from '../../model/entities/media'

export class MediaDatabaseChangedService implements DataChangeService {

  private static instance: DataChangeService

  public static getInstance(
    mediaEventEmitter: MediaEventEmitter,
    mediaChangedListener: DataChangedListener<Media>
  ): DataChangeService {
    if (!this.instance) {
      this.instance = new MediaDatabaseChangedService(
        mediaEventEmitter,
        mediaChangedListener
      )
    }
    return this.instance
  }

  private constructor(private readonly mediaEventEmitter: MediaEventEmitter, mediaChangedListener: DataChangedListener<Media>) {
    this.listenForMediaChanges(mediaChangedListener)
  }

  private listenForMediaChanges(mediaChangedListener: DataChangedListener<Media>): void {
    mediaChangedListener.onCreated(media => this.createMedia(media))
    mediaChangedListener.onUpdated(media => this.updateMedia(media))
    mediaChangedListener.onDeleted(mediaId => this.deleteMedia(mediaId))
  }

  private createMedia(media: Media): void {
    this.mediaEventEmitter.emitMediaCreated(media)
  }

  private updateMedia(media: Media): void {
    this.mediaEventEmitter.emitMediaUpdated(media)
  }

  private deleteMedia(mediaId: string): void {
    this.mediaEventEmitter.emitMediaDeleted(mediaId)
  }
}

