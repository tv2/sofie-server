import { PlayoutContent } from '../domain/value-objects/playout-content'

export interface PlayoutContentEventEmitter {
  emitProgramPlayoutContentEvent(programPlayoutContents: PlayoutContent[]): void
  emitPreviewPlayoutContentEvent(previewPlayoutContents: PlayoutContent[]): void
}
