import { ActionManifest } from '../../../rundown-execution/domain/entities/action'

export interface ActionManifestRepository {
  getActionManifests(rundownId: string): Promise<ActionManifest[]>
}
