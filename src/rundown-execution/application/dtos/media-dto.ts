import { Media } from '../../../sofie-ingest/domain/entities/media'

export class MediaDto {
  public readonly id: string
  public readonly sourceName: string
  public readonly duration?: number

  public constructor(media: Media) {
    this.id = media.id
    this.sourceName = media.sourceName
    this.duration = media.duration
  }
}
