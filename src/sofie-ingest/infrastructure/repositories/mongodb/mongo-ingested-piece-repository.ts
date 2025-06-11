import { IngestedPieceRepository } from '../../../domain/repositories/ingested-piece-repository'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { IngestedPiece } from '../../../../rundown-execution/domain/entities/ingested-piece'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedPiece } from '../../../../rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-entity-converter'

const INGESTED_PIECE_COLLECTION_NAME: string = 'pieces' // TODO: Once we control ingest renamed to "ingestedPieces".

export class MongoIngestedPieceRepository extends BaseMongoRepository<MongoIngestedPiece> implements IngestedPieceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoIngestedEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return INGESTED_PIECE_COLLECTION_NAME
  }

  public async getIngestedPiecesForRundown(rundownId: string): Promise<IngestedPiece[]> {
    this.assertDatabaseConnection(this.getIngestedPiecesForRundown.name)
    const mongoPieces: MongoIngestedPiece[] = (await this.getCollection()
      .find<MongoIngestedPiece>({ startRundownId: rundownId })
      .toArray())
    return this.mongoEntityConverter.convertToIngestedPieces(mongoPieces)
  }

  public async deleteIngestedPiecesForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedPiecesForRundown.name)
    await this.getCollection().deleteMany({ startRundownId: rundownId })
  }
}
