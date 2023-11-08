import { BaseMongoRepository } from './base-mongo-repository'
import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoEntityConverter } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'

const AD_LIB_PIECES_COLLECTION: string = 'adLibPieces'

interface AdLibPiece {
  sourceLayerId: string
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

  public async getActionManifests(): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const mongoAdLibPieces: AdLibPiece[] = await this.getCollection().find<AdLibPiece>({}).toArray()
    return mongoAdLibPieces.map(adLibPiece => this.mapToActionManifest(adLibPiece))
  }

  private mapToActionManifest(adLibPiece: AdLibPiece): ActionManifest {
    return {
      actionId: adLibPiece.sourceLayerId,
      data: {
        name: adLibPiece.name,
        expectedDuration: adLibPiece.expectedDuration ?? undefined,
      },
    }
  }
}