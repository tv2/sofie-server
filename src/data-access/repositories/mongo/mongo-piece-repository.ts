import { BaseMongoRepository } from './base-mongo-repository'
import { Piece } from '../../../model/entities/piece'
import { MongoDatabase } from './mongo-database'
import {
  AnyBulkWriteOperation,
  ClientSession,
} from 'mongodb'
import { MongoEntityConverter, MongoPiece } from './mongo-entity-converter'

const PIECE_COLLECTION_NAME: string = 'executedPieces' // TODO: Once we control ingest rename to "pieces".

export class MongoPieceRepository extends BaseMongoRepository<MongoPiece> {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return PIECE_COLLECTION_NAME
  }

  public getPieces(partId: string): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPieces.name)
    return this.getCollection()
      .find<MongoPiece>({ partId })
      .map(mongoPiece => this.mongoEntityConverter.convertToPiece(mongoPiece))
      .toArray()
  }

  public getPiecesFromIds(pieceIds: string[] = []): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPiecesFromIds.name)
    return this.getCollection()
      .find<MongoPiece>({ _id: { $in: pieceIds } })
      .map(mongoPiece => this.mongoEntityConverter.convertToPiece(mongoPiece))
      .toArray()
  }

  public buildSavePieceQueries(pieces: readonly Piece[]): AnyBulkWriteOperation<MongoPiece>[] {
    return pieces.map(piece => this.buildSavePieceQuery(piece))
  }

  private buildSavePieceQuery(piece: Piece): AnyBulkWriteOperation<MongoPiece> {
    const mongoPiece: MongoPiece = this.mongoEntityConverter.convertToMongoPiece(piece)
    return {
      updateOne: {
        filter: { _id: mongoPiece._id },
        update: { $set: mongoPiece },
        upsert: true,
      }
    }
  }

  public buildDeleteOrphanedPiecesForPartsQuery(partIds: readonly string[], pieces: readonly Piece[]): AnyBulkWriteOperation<MongoPiece> {
    return {
      deleteMany: {
        filter: { partId: { $in: partIds }, _id: { $nin: pieces.map(piece => piece.id) } }
      }
    }
  }

  public async executeQueries(queries: readonly AnyBulkWriteOperation<MongoPiece>[], session: ClientSession): Promise<void> {
    if (queries.length === 0) {
      return
    }
    await this.getCollection().bulkWrite([...queries], { session, ignoreUndefined: true })
  }

  public buildDeletePiecesForRundownQuery(partIds: readonly string[]): AnyBulkWriteOperation<MongoPiece> {
    return {
      deleteMany: {
        filter: { partId: { $in: partIds } },
      },
    }
  }
}
