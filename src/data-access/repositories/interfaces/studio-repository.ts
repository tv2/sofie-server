import { Studio } from '../../../rundown-execution/domain/entities/studio'

export interface StudioRepository {
  getStudio(studioId: string): Promise<Studio>
}
