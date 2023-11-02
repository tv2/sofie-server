import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoEntityConverter } from './mongo-entity-converter'
import { PieceType } from '../../../model/enums/piece-type'
import { UnexpectedCaseException } from '../../../model/exceptions/unexpected-case-exception'

const AD_LIB_ACTIONS_COLLECTION: string = 'adLibActions'

interface AdLibAction {
  actionId: string
  userData: unknown
}
export class MongoAdLibActionsRepository extends BaseMongoRepository implements ActionManifestRepository {

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return AD_LIB_ACTIONS_COLLECTION
  }

  public async getActionManifests(): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const adLibActions: AdLibAction[] = await this.getCollection().find<AdLibAction>({}).toArray()
    return adLibActions.map(adLibAction => this.mapToActionManifest(adLibAction))
  }

  private mapToActionManifest(adLibAction: AdLibAction): ActionManifest {
    return {
      pieceType: this.getPieceTypeFromAdLibAction(adLibAction),
      data: adLibAction.userData
    }
  }

  private getPieceTypeFromAdLibAction(adLibAction: AdLibAction): PieceType {
    switch (adLibAction.actionId) {
      case 'select_full_grafik': {
        return PieceType.GRAPHIC
      }
      case 'select_server_clip': {
        return PieceType.VIDEO_CLIP
      }
      case 'select_dve': {
        return PieceType.DVE
      }
      default: {
        throw new UnexpectedCaseException(`Unknown actionId: ${adLibAction.actionId}`)
      }
    }
  }
}
