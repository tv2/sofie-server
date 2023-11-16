import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoEntityConverter } from './mongo-entity-converter'

const AD_LIB_ACTIONS_COLLECTION: string = 'adLibActions'

interface AdLibAction {
  actionId: string
  rundownId: string
  userData: unknown
}
export class MongoAdLibActionsRepository extends BaseMongoRepository implements ActionManifestRepository {

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return AD_LIB_ACTIONS_COLLECTION
  }

  public async getActionManifests(rundownId: string): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const adLibActions: AdLibAction[] = await this.getCollection().find<AdLibAction>({rundownId: rundownId}).toArray()
    return adLibActions.map(adLibAction => this.mapToActionManifest(adLibAction))
  }

  private mapToActionManifest(adLibAction: AdLibAction): ActionManifest {
    return {
      actionId: adLibAction.actionId,
      rundownId: adLibAction.rundownId,
      data: adLibAction.userData
    }
  }
}
