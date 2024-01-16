import {Media} from '../../model/entities/media'


export class MediaDto {
  public readonly mediaId: string
  constructor(media: Media) {
    this.mediaId = media.mediaId
  }
}
