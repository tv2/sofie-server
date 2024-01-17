import { Media } from '../../model/entities/media'

export class MediaDto {

  public readonly id: string
  public readonly duration?: number

  constructor(media: Media) {
    this.id = media.id
    this.duration = media.duration
  }
}
