import { Rundown } from '../../../model/entities/rundown'

export interface PlayoutContentService {
  updatePlayoutContentState(rundown: Rundown): void
}
