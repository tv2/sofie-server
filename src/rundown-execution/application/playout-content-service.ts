import { Rundown } from '../domain/entities/rundown'
import { PlayoutContent } from '../domain/value-objects/playout-content'

export interface PlayoutContentUpdateService {
  initialize(): Promise<void>
  updatePlayoutContentState(rundown: Rundown): Promise<void>
}

export interface PlayoutContentReadService {
  getProgramPlayoutContentState(): readonly PlayoutContent[]
  getPreviewPlayoutContentState(): readonly PlayoutContent[]
}
