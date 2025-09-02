import { Studio } from '../entities/studio'

export interface StudioRepository {
  getStudio(studioId: string): Promise<Studio>
}
