import { DataChangeService } from '../../../rundown-execution/application/interfaces/data-change-service'
import { MediaEventEmitter } from '../../../rundown-execution/application/interfaces/media-event-emitter'
import { DataChangedListener } from '../../../cross-cutting-concerns/application/interfaces/data-changed-listener'
import { Media } from '../../../rundown-execution/domain/entities/media'

export class MediaDatabaseChangedService implements DataChangeService {
  constructor(private readonly mediaEventEmitter: MediaEventEmitter, mediaChangedListener: DataChangedListener<Media>) {
    this.listenForMediaChanges(mediaChangedListener)
  }

  public initialize(): Promise<void> {
    return Promise.resolve()
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
