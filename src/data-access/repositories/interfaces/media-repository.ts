import { Media } from '../../../model/entities/media'

export interface MediaRepository {
  getMedia(): Promise<Media[]>
  getMediaBySourceName(sourceName: string): Promise<Media | undefined>
}
