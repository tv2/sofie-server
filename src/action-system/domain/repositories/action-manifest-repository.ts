import { ActionManifest } from '../entities/action'

export interface ActionManifestRepository {
  getActionManifests(rundownId: string): Promise<ActionManifest[]>
}
