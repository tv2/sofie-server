import { ActionManifest } from '../../../model/entities/action'

export interface ActionManifestRepository {
  getActionManifests(): Promise<ActionManifest[]>
}
