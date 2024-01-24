import { BaseMongoRepository } from './base-mongo-repository'
import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { Filter } from 'mongodb'
import { MongoId } from './mongo-entity-converter'

const AD_LIB_PIECES_COLLECTION: string = 'adLibPieces'

interface AdLibPiece {
  sourceLayerId: string
  rundownId: string
  name: string
  expectedDuration: number | null
}

export class MongoAdLibPieceRepository extends BaseMongoRepository implements ActionManifestRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return AD_LIB_PIECES_COLLECTION
  }

  public async getActionManifests(rundownId: string): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const mongoAdLibPieces: AdLibPiece[] = await this.getCollection().find<AdLibPiece>({
      rundownId: rundownId,
      ...this.filterOutCommentatorManifests()
    }).toArray()
    return mongoAdLibPieces.map(adLibPiece => this.mapToActionManifest(adLibPiece))
  }

  // Todo: The filter is Tv2 specific. Remove filtering when we control ingest.
  private filterOutCommentatorManifests(): Filter<MongoId> {
    return { uniquenessId: { $not: { $regex: '.*_commentator$' } } }
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
