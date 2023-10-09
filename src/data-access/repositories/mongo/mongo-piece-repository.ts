import { BaseMongoRepository } from './base-mongo-repository'
import { PieceRepository } from '../interfaces/piece-repository'
import { Piece } from '../../../model/entities/piece'
import { MongoEntityConverter, MongoPiece } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { DeleteResult } from 'mongodb'

const PIECE_COLLECTION_NAME: string = 'pieces'

export class MongoPieceRepository extends BaseMongoRepository implements PieceRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return PIECE_COLLECTION_NAME
  }

  public async getPieces(partId: string): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPieces.name)
    const mongoPieces: MongoPiece[] = (await this.getCollection()
      .find<MongoPiece>({ startPartId: partId })
      .toArray())
    return this.mongoEntityConverter.convertPieces(mongoPieces)
  }

  public async savePiece(piece:Piece): Promise<void> {
    this.assertDatabaseConnection(this.savePiece.name)
    const mongoPiece: MongoPiece = this.mongoEntityConverter.convertToMongoPiece(piece)
    await this.getCollection().updateOne(
      { _id: piece.id },
      { $set: mongoPiece },
      { upsert: piece.isUnsynced() }
    )
  }

  public async deletePiecesForPart(partId: string): Promise<void> {
    this.assertDatabaseConnection(this.deletePiecesForPart.name)
    const piecesDeletionResult: DeleteResult = await this.getCollection().deleteMany({ startPartId: partId })

    if (!piecesDeletionResult.acknowledged) {
      throw new DeletionFailedException(`Deletion of pieces was not acknowledged, for partId: ${partId}`)
    }
  }
}
