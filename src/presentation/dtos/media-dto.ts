import { Media } from '../../model/entities/media'

export class MediaDto {
  public readonly mediaName: string
  constructor(media: Media) {
    this.mediaName = media.mediaName
  }
}
