import { ActionManifest } from '../../../model/entities/action'

export interface ManifestRepository {
  getActionManifests(): Promise<ActionManifest[]>
}