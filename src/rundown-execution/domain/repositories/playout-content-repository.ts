import { PlayoutContent } from '../value-objects/playout-content'

export interface PlayoutContentRepository {
  savePlayoutContents(programPlayoutContents: PlayoutContent[], previewPlayoutContent: PlayoutContent[]): Promise<void>
  getProgramPlayoutContents(): Promise<PlayoutContent[]>
  getPreviewPlayoutContents(): Promise<PlayoutContent[]>
}
