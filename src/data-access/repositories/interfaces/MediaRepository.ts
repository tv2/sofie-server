import { Media } from '../../../model/entities/media'

export interface MediaRepository {
  getMedia(): Promise<Media[]>
  getMediaById(mediaId: string): Promise<Media | undefined>
}
