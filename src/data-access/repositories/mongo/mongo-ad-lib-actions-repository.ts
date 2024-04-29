import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'

const AD_LIB_ACTIONS_COLLECTION: string = 'adLibActions'

interface MongoAdLibAction {
  actionId: string
  rundownId: string
  userData: unknown
  display: {
    _rank: number
  }
}

export class MongoAdLibActionsRepository extends BaseMongoRepository implements ActionManifestRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return AD_LIB_ACTIONS_COLLECTION
  }

  public async getActionManifests(rundownId: string): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const adLibActions: MongoAdLibAction[] = await this.getCollection().find<MongoAdLibAction>({ rundownId }).toArray()
    return adLibActions.map(adLibAction => this.mapToActionManifest(adLibAction))
  }

  private mapToActionManifest(adLibAction: MongoAdLibAction): ActionManifest {
    return {
      actionId: adLibAction.actionId,
      rundownId: adLibAction.rundownId,
      data: {
        rank: adLibAction.display._rank,
        userData: adLibAction.userData
      }
    }
  }
}
