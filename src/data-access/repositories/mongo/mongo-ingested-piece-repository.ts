import { IngestedPieceRepository } from '../interfaces/ingested-piece-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { IngestedPiece } from '../../../model/entities/ingested-piece'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedPiece } from './mongo-ingested-entity-converter'

const INGESTED_PIECE_COLLECTION_NAME: string = 'pieces' // TODO: Once we control ingest renamed to "ingestedPieces".

export class MongoIngestedPieceRepository extends BaseMongoRepository implements IngestedPieceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoIngestedEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return INGESTED_PIECE_COLLECTION_NAME
  }

  public async getIngestedPieces(partId: string): Promise<IngestedPiece[]> {
    this.assertDatabaseConnection(this.getIngestedPieces.name)
    const mongoPieces: MongoIngestedPiece[] = (await this.getCollection()
      .find<MongoIngestedPiece>({ startPartId: partId })
      .toArray())
    return this.mongoEntityConverter.convertIngestedPieces(mongoPieces)
  }

  public async deleteIngestedPiecesForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedPiecesForRundown.name)
    await this.getCollection().deleteMany({ startRundownId: rundownId})
  }
}
