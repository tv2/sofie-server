import { ActionManifest } from '../../../model/entities/action'

export interface ActionManifestsRepository {
  getActionManifests(): Promise<ActionManifest[]>
}