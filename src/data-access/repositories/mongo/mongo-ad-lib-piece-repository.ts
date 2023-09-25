import { BaseMongoRepository } from './base-mongo-repository'
import { AdLibPieceRepository } from '../interfaces/ad-lib-piece-repository'
import { Identifier } from '../../../model/value-objects/identifier'
import { MongoAdLibPiece, MongoEntityConverter } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const AD_LIB_COLLECTION_NAME: string = 'adLibPieces'

export class MongoAdLibPieceRepository extends BaseMongoRepository implements AdLibPieceRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return AD_LIB_COLLECTION_NAME
  }

  public async getAdLibPieceIdentifiers(rundownId: string): Promise<Identifier[]> {
    this.assertDatabaseConnection(this.getAdLibPieceIdentifiers.name)
    const mongoAdLibPieces: MongoAdLibPiece[] = (await this.getCollection()
      .find<MongoAdLibPiece>({ rundownId: rundownId })
      .toArray())
    return this.mongoEntityConverter.convertMongoAdLibPiecesToIdentifiers(mongoAdLibPieces)
  }

  public async getAdLibPiece(adLibPieceId: string): Promise<AdLibPiece> {
    this.assertDatabaseConnection(this.getAdLibPiece.name)
    const mongoAdLibPiece: MongoAdLibPiece | null = (await this.getCollection().findOne<MongoAdLibPiece>({
      _id: adLibPieceId,
    }))
    if (!mongoAdLibPiece) {
      throw new NotFoundException(`No AdLibPiece found for AdLibPieceId: "${adLibPieceId}"`)
    }
    return this.mongoEntityConverter.convertAdLib(mongoAdLibPiece)
  }
}
