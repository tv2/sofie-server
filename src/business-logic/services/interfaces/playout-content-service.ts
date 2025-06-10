import { Rundown } from '../../../rundown-execution/domain/entities/rundown'
import { PlayoutContent } from '../../../rundown-execution/domain/value-objects/playout-content'

export interface PlayoutContentUpdateService {
  initialize(): Promise<void>
  updatePlayoutContentState(rundown: Rundown): Promise<void>
}

export interface PlayoutContentReadService {
  getProgramPlayoutContentState(): readonly PlayoutContent[]
  getPreviewPlayoutContentState(): readonly PlayoutContent[]
}
