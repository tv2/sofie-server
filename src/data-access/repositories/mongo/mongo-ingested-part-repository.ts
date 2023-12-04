import { BaseMongoRepository } from './base-mongo-repository'
import { IngestedPartRepository } from '../interfaces/ingested-part-repository'
import { IngestedPart } from '../../../model/entities/ingested-part'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedPart } from './mongo-ingested-entity-converter'
import { IngestedPieceRepository } from '../interfaces/ingested-piece-repository'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const INGESTED_PART_COLLECTION_NAME: string = 'parts' // TODO: Once we control ingest rename to "ingestedParts"

export class MongoIngestedPartRepository extends BaseMongoRepository implements IngestedPartRepository {

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

  public async getIngestedPart(partId: string): Promise<IngestedPart> {
    this.assertDatabaseConnection(this.getIngestedPart.name)
    const mongoIngestedPart: MongoIngestedPart | null = await this.getCollection().findOne<MongoIngestedPart>({
      _id: partId
    })
    if (!mongoIngestedPart) {
      throw new NotFoundException(`No Part found for partId: ${partId}`)
    }
    return {
      ...this.mongoIngestedEntityConverter.convertToIngestedPart(mongoIngestedPart),
      ingestedPieces: await this.ingestedPieceRepository.getIngestedPieces(mongoIngestedPart._id)
    }
  }

  public async getIngestedParts(segmentId: string): Promise<IngestedPart[]> {
    this.assertDatabaseConnection(this.getIngestedParts.name)
    const mongoIngestedParts: MongoIngestedPart[] = await this.getCollection()
      .find<MongoIngestedPart>({ segmentId: segmentId })
      .toArray()
    const ingestedParts: IngestedPart[] = this.mongoIngestedEntityConverter.convertToIngestedParts(mongoIngestedParts)
    return Promise.all(
      ingestedParts.map(async (ingestedPart) => {
        return {
          ...ingestedPart,
          ingestedPieces: await this.ingestedPieceRepository.getIngestedPieces(ingestedPart.id)
        }
      })
    )
  }

  public async deleteIngestedPartsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedPartsForRundown.name)
    await this.ingestedPieceRepository.deleteIngestedPiecesForRundown(rundownId)
    await this.getCollection().deleteMany({ rundownId: rundownId })
  }
}
