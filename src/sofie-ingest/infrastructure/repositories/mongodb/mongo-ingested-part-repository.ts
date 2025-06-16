import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { IngestedPartRepository } from '../../../domain/repositories/ingested-part-repository'
import { IngestedPart } from '../../../../rundown-execution/domain/entities/ingested-part'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedPart } from '../../../../rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-entity-converter'
import { IngestedPieceRepository } from '../../../domain/repositories/ingested-piece-repository'
import { IngestedPiece } from '../../../../rundown-execution/domain/entities/ingested-piece'

const INGESTED_PART_COLLECTION_NAME: string = 'parts' // TODO: Once we control ingest rename to "ingestedParts"

export class MongoIngestedPartRepository extends BaseMongoRepository<MongoIngestedPart> implements IngestedPartRepository {

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    private readonly ingestedPieceRepository: IngestedPieceRepository
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return INGESTED_PART_COLLECTION_NAME
  }

  public async getIngestedPartsForRundown(rundownId: string, ingestedPieces: readonly IngestedPiece[]): Promise<IngestedPart[]> {
    this.assertDatabaseConnection(this.getIngestedPartsForRundown.name)
    return this.getCollection()
      .find<MongoIngestedPart>({ rundownId })
      .map(mongoIngestedPart => ({
        ...this.mongoIngestedEntityConverter.convertToIngestedPart(mongoIngestedPart),
        ingestedPieces: ingestedPieces.filter(ingestedPiece => ingestedPiece.partId === mongoIngestedPart._id)
      }))
      .toArray()
  }

  public async deleteIngestedPartsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedPartsForRundown.name)
    await this.ingestedPieceRepository.deleteIngestedPiecesForRundown(rundownId)
    await this.getCollection().deleteMany({ rundownId: rundownId })
  }
}
