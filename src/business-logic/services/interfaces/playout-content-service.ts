import { Rundown } from '../../../model/entities/rundown'
import { PlayoutContent } from '../../../model/value-objects/playout-content'

export interface PlayoutContentUpdateService {
  updatePlayoutContentState(rundown: Rundown): void
}

export interface PlayoutContentReadService {
  getProgramPlayoutContentState(): readonly PlayoutContent[]
  getPreviewPlayoutContentState(): readonly PlayoutContent[]
}
