import { BaseMongoRepository } from './base-mongo-repository'
import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoEntityConverter } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'

const AD_LIB_PIECES_COLLECTION: string = 'adLibPieces'

interface AdLibPiece {
  sourceLayerId: string
  rundownId: string
  name: string
  expectedDuration: number | null
}

export class MongoAdLibPieceRepository extends BaseMongoRepository implements ActionManifestRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return AD_LIB_PIECES_COLLECTION
  }

  public async getActionManifests(rundownId: string): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    // Todo: The filter is Tv2 specific. Remove filtering when we control ingest.
    const mongoAdLibPieces: AdLibPiece[] = await this.getCollection().find<AdLibPiece>({
      rundownId: rundownId, uniquenessId: {$not: { $regex: '.*_commentator$'}}
    }).toArray()
    return mongoAdLibPieces.map(adLibPiece => this.mapToActionManifest(adLibPiece))
  }

  private mapToActionManifest(adLibPiece: AdLibPiece): ActionManifest {
    return {
      actionId: adLibPiece.sourceLayerId,
      rundownId: adLibPiece.rundownId,
      data: {
        name: adLibPiece.name,
        expectedDuration: adLibPiece.expectedDuration ?? undefined,
        sourceLayerId: adLibPiece.sourceLayerId
      },
    }
  }
}