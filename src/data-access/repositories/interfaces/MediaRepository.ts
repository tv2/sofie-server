import { Media } from '../../../model/entities/media'

export interface MediaRepository {
  getMedia(mediaId: string): Promise<Media | undefined>
}
