import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'

export class MongoActionManifestRepository implements ActionManifestRepository {

  constructor(private readonly actionManifestRepositories: ActionManifestRepository[]) {
  }

  public async getActionManifests(rundownId: string): Promise<ActionManifest[]> {
    const actionManifests: ActionManifest[] = []
    for (const repository of this.actionManifestRepositories) {
      actionManifests.push(...(await repository.getActionManifests(rundownId)))
    }
    return actionManifests
  }
}