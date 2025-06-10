import { Media } from '../../../rundown-execution/domain/entities/media'

export interface MediaRepository {
  getMedia(): Promise<Media[]>
  getMediaBySourceName(sourceName: string): Promise<Media | undefined>
}
