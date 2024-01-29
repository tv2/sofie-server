import { BaseMongoRepository } from './base-mongo-repository'
import { PieceRepository } from '../interfaces/piece-repository'
import { Piece } from '../../../model/entities/piece'
import { MongoDatabase } from './mongo-database'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { DeleteResult } from 'mongodb'
import { MongoEntityConverter, MongoId, MongoPiece } from './mongo-entity-converter'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'

export const PIECE_COLLECTION_NAME: string = 'executedPieces' // TODO: Once we control ingest rename to "pieces".

export class MongoPieceRepository extends BaseMongoRepository implements PieceRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return PIECE_COLLECTION_NAME
  }

  public async getPieces(partId: string): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPieces.name)
    const mongoPieces: MongoPiece[] = (await this.getCollection()
      .find<MongoPiece>({ partId: partId })
      .toArray())
    return this.mongoEntityConverter.convertToPieces(mongoPieces)
  }

  public async getPiecesFromIds(pieceIds: string[] = []): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPiecesFromIds.name)
    const mongoPieces: MongoPiece[] = await this.getCollection().find<MongoPiece>(
      {
        _id: { $in: pieceIds }
      }
    ).toArray()
    return this.mongoEntityConverter.convertToPieces(mongoPieces)
  }

  public async savePiece(piece: Piece): Promise<void> {
    this.assertDatabaseConnection(this.savePiece.name)
    const mongoPiece: MongoPiece = this.mongoEntityConverter.convertToMongoPiece(piece)
    await this.getCollection().updateOne(
      { _id: mongoPiece._id },
      { $set: mongoPiece },
      { upsert: true, ignoreUndefined: true }
    )
  }

  public async deletePiecesForPart(partId: string): Promise<void> {
    this.assertDatabaseConnection(this.deletePiecesForPart.name)
    const piecesDeletionResult: DeleteResult = await this.getCollection().deleteMany({ partId: partId })

    if (!piecesDeletionResult.acknowledged) {
      throw new DeletionFailedException(`Deletion of pieces was not acknowledged, for partId: ${partId}`)
    }
  }

  public async deletePieces(pieceIdsToBeDeleted: string[]): Promise<void> {
    await this.getCollection().deleteMany({ _id: { $in: pieceIdsToBeDeleted }})
  }

  public async deleteUnsyncedInfinitePiecesNotOnAnyRundown(): Promise<void> {
    const infinitePieceIdsOnRundowns: string[] = await this.getInfinitePieceIdsOnRundowns()
    await this.getCollection().deleteMany({
      _id: { $nin: infinitePieceIdsOnRundowns },
      isUnsynced: true,
      lifespan: { $ne: PieceLifespan.WITHIN_PART }
    })
  }

  private async getInfinitePieceIdsOnRundowns(): Promise<string[]> {
    const mongoIds: MongoId[] = await this.getCollection()
      .aggregate<MongoPiece>()
      .lookup({
        from: 'rundowns',
        localField: '_id',
        foreignField: 'infinitePieceIds',
        as: 'rundown'
      })
      .match({ rundown: { $ne: [] } })
      .project<MongoId>({ _id: 1 })
      .toArray()
    return mongoIds.map(mongoId => mongoId._id)
  }

  /*
  * NOTE: This will delete ALL unsynced Pieces in the database. Should only be used on deactivate or activate Rundown.
  */
  public async deleteAllUnsyncedPieces(): Promise<void> {
    this.assertDatabaseConnection(this.deleteAllUnsyncedPieces.name)
    await this.getCollection().deleteMany({
      isUnsynced: true
    })
  }

  /*
  * NOTE: This will delete ALL unplanned Pieces in the database. Should only be used on deactivate or activate Rundown.
  */
  public async deleteAllUnplannedPieces(): Promise<void> {
    this.assertDatabaseConnection(this.deleteAllUnsyncedPieces.name)
    await this.getCollection().deleteMany({
      isPlanned: false
    })
  }
}
