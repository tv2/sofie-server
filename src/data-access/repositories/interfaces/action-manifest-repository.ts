import { ActionManifest } from '../../../model/entities/action'

export interface ActionManifestRepository {
  getActionManifests(rundownId: string): Promise<ActionManifest[]>
}
