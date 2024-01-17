import { Media } from '../../model/entities/media'

export class MediaDto {
  public readonly sourceName: string
  constructor(media: Media) {
    this.sourceName = media.sourceName
  }
}
