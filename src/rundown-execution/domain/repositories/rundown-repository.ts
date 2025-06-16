import { Rundown } from '../entities/rundown'
import { BasicRundown } from '../entities/basic-rundown'

export interface RundownRepository {
  getBasicRundowns(): Promise<BasicRundown[]>
  getRundown(rundownId: string): Promise<Rundown>
  saveRundown(rundown: Rundown): Promise<void>
  deleteRundown(rundownId: string): Promise<void>
}
