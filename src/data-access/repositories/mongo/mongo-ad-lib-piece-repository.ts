import { BaseMongoRepository } from './base-mongo-repository'
import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { Filter } from 'mongodb'
import { MongoId } from './mongo-entity-converter'

const AD_LIB_PIECES_COLLECTION: string = 'adLibPieces'

interface MongoAdLibPiece {
  sourceLayerId: string
  rundownId: string
  name: string
  _rank: number
  expectedDuration: number | null
  lifespan: string | null
  content?: {
    path: string
  }
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
    const mongoAdLibPieces: MongoAdLibPiece[] = await this.getCollection().find<MongoAdLibPiece>({
      rundownId: rundownId,
      ...this.filterOutCommentatorManifests()
    }).toArray()
    return mongoAdLibPieces.map(adLibPiece => this.mapToActionManifest(adLibPiece))
  }

  // Todo: The filter is Tv2 specific. Remove filtering when we control ingest.
  private filterOutCommentatorManifests(): Filter<MongoId> {
    return { uniquenessId: { $not: { $regex: '.*_commentator$' } } }
  }

  private mapToActionManifest(adLibPiece: MongoAdLibPiece): ActionManifest {
    return {
      actionId: adLibPiece.sourceLayerId,
      rundownId: adLibPiece.rundownId,
      data: {
        name: adLibPiece.name,
        rank: adLibPiece._rank,
        expectedDuration: adLibPiece.expectedDuration ?? undefined,
        sourceLayerId: adLibPiece.sourceLayerId,
        lifespan: adLibPiece.lifespan ?? undefined,
        content: adLibPiece.content
      },
    }
  }
}
