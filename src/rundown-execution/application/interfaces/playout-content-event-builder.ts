import { PreviewPlayoutContentEvent, ProgramPlayoutContentEvent } from '../value-objects/playout-content-event'
import { PlayoutContent } from '../../domain/value-objects/playout-content'

export interface PlayoutContentEventBuilder {
  buildProgramPlayoutContentEvent(playoutContents: PlayoutContent[]): ProgramPlayoutContentEvent
  buildPreviewPlayoutContentEvent(playoutContents: PlayoutContent[]): PreviewPlayoutContentEvent
}
